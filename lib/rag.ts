import { embedOne, generateJson } from "./gemini";
import { search, sampleChunks } from "./store";
import { SIMILARITY_FLOOR, TOP_K } from "./config";
import type { ChatResponse, ChatTurn, FaqItem, RetrievedChunk } from "./types";

const GROUNDING_RULES = `You are a careful research assistant for a NotebookLM-style app.
You answer ONLY from the numbered SOURCES provided. Rules:
- Use only information present in the sources. Never use outside knowledge.
- Cite every claim inline with bracketed numbers like [1] or [2][4], matching the source numbers.
- If the user asks for a summary or overview, summarize the information in the provided sources
  (this IS answerable from the sources — do not refuse it).
- If the sources do not contain enough information to answer a specific question, set
  "sufficient_evidence" to false and briefly say what is missing. Do NOT guess or fill gaps.
- Always respond in the same language as the user's question.
- When you answer, also propose up to 3 short, natural follow-up questions that ARE answerable from
  the sources (in "follow_ups"), in the same language. If you cannot answer, leave "follow_ups" empty.
- Be concise and factual.`;

function renderSources(evidence: RetrievedChunk[]): string {
  return evidence
    .map((e) => `[${e.n}] (from "${e.sourceTitle}")\n${e.text}`)
    .join("\n\n");
}

/**
 * Answer a question strictly from the user's sources.
 *
 * Two independent gates protect against hallucination:
 *  1. A server-side similarity floor — if the best retrieved chunk is too weak, we abstain
 *     before ever calling the model (deterministic, quota-free).
 *  2. The model's own "sufficient_evidence" self-assessment as a second line of defense.
 */
export async function answerQuestion(
  question: string,
  sourceIds?: string[],
  history: ChatTurn[] = [],
): Promise<ChatResponse> {
  // Memory-aware retrieval: prepend the previous user question so follow-ups like
  // "and who founded it?" still retrieve the right context. Cheap (no extra LLM call).
  const lastUser = [...history].reverse().find((t) => t.role === "user");
  const retrievalQuery = lastUser ? `${lastUser.content}\n${question}` : question;

  const queryEmbedding = await embedOne(retrievalQuery, "RETRIEVAL_QUERY");
  const evidence = await search(queryEmbedding, TOP_K, sourceIds);

  if (evidence.length === 0) {
    return {
      answered: false,
      answer: "There are no sources yet. Add a document, paste text, or add a URL to get started.",
      evidence: [],
      citations: [],
      followUps: [],
    };
  }

  // Gate 1: deterministic confidence floor.
  if (evidence[0].score < SIMILARITY_FLOOR) {
    return {
      answered: false,
      answer:
        "I can't find sufficient evidence in your sources to answer that. Here's the closest related material I found — you may want to rephrase, or add a source that covers this.",
      evidence: evidence.slice(0, 3),
      citations: [],
      followUps: [],
    };
  }

  const convo =
    history.length > 0
      ? `CONVERSATION SO FAR (for resolving references only; still answer ONLY from the sources):\n${history
          .map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${t.content}`)
          .join("\n")}\n\n`
      : "";
  const prompt = `${convo}SOURCES:\n${renderSources(evidence)}\n\nQUESTION: ${question}`;
  const schema = {
    type: "OBJECT",
    properties: {
      sufficient_evidence: { type: "BOOLEAN" },
      answer: { type: "STRING" },
      used_chunks: { type: "ARRAY", items: { type: "INTEGER" } },
      follow_ups: { type: "ARRAY", items: { type: "STRING" } },
    },
    required: ["sufficient_evidence", "answer", "used_chunks", "follow_ups"],
  };

  const result = await generateJson<{
    sufficient_evidence: boolean;
    answer: string;
    used_chunks: number[];
    follow_ups: string[];
  }>(prompt, GROUNDING_RULES, schema);

  // Gate 2: model's self-assessment.
  if (!result.sufficient_evidence) {
    return {
      answered: false,
      answer:
        result.answer?.trim() ||
        "I can't find sufficient evidence in your sources to answer that confidently.",
      evidence: evidence.slice(0, 3),
      citations: [],
      followUps: [],
    };
  }

  const valid = (result.used_chunks ?? []).filter((n) => n >= 1 && n <= evidence.length);
  return {
    answered: true,
    answer: result.answer.trim(),
    evidence,
    citations: Array.from(new Set(valid)),
    followUps: (result.follow_ups ?? []).slice(0, 3),
  };
}

/**
 * Generate a grounded, cited summary of the sources. Uses a representative spread of
 * chunks (not top-k retrieval) so the summary reflects the whole document — this is why a
 * "summarize this" request belongs here rather than in the Q&A path.
 */
export async function generateSummary(
  sourceIds?: string[],
): Promise<{ summary: string; evidence: RetrievedChunk[] }> {
  const evidence = await sampleChunks(20, sourceIds);
  if (evidence.length === 0) return { summary: "", evidence: [] };

  const prompt = `SOURCES:\n${renderSources(evidence)}\n\nWrite a concise summary (4–7 sentences) of what these sources cover. Ground every statement in the sources and cite the source numbers inline.`;
  const schema = {
    type: "OBJECT",
    properties: { summary: { type: "STRING" } },
    required: ["summary"],
  };
  const result = await generateJson<{ summary: string }>(prompt, GROUNDING_RULES, schema);
  return { summary: (result.summary ?? "").trim(), evidence };
}

/**
 * Generate a short, spoken-style overview script of the sources, for the (free, browser-based)
 * Audio Overview. Plain prose, no citations/markdown — it's meant to be read aloud.
 */
export async function generateAudioScript(sourceIds?: string[]): Promise<{ script: string }> {
  const evidence = await sampleChunks(20, sourceIds);
  if (evidence.length === 0) return { script: "" };

  const prompt = `SOURCES:\n${renderSources(evidence)}\n\nWrite a short, engaging spoken overview (about 150–200 words) of these sources, as if narrating a quick audio briefing for a busy listener. Use natural, conversational prose. No markdown, no bullet points, and no bracketed citation numbers. Stay strictly grounded in the sources, in the same language as the sources.`;
  const schema = {
    type: "OBJECT",
    properties: { script: { type: "STRING" } },
    required: ["script"],
  };
  const result = await generateJson<{ script: string }>(prompt, GROUNDING_RULES, schema);
  return { script: (result.script ?? "").replace(/\[\d+\]/g, "").trim() };
}

/**
 * Proactively generate a grounded, cited FAQ from the corpus — the "help me work with
 * information, not just search it" feature. Every answer cites the chunks it came from.
 */
export async function generateFaq(
  sourceIds?: string[],
): Promise<{ faqs: FaqItem[]; evidence: RetrievedChunk[] }> {
  const evidence = await sampleChunks(16, sourceIds);
  if (evidence.length === 0) return { faqs: [], evidence: [] };

  const prompt = `SOURCES:\n${renderSources(evidence)}\n\nFrom these sources, write the 5 most useful FAQ entries a reader would want answered. Each answer must be grounded only in the sources and cite the source numbers it relies on.`;
  const schema = {
    type: "OBJECT",
    properties: {
      faqs: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            question: { type: "STRING" },
            answer: { type: "STRING" },
            citations: { type: "ARRAY", items: { type: "INTEGER" } },
          },
          required: ["question", "answer", "citations"],
        },
      },
    },
    required: ["faqs"],
  };

  const result = await generateJson<{ faqs: FaqItem[] }>(
    prompt,
    GROUNDING_RULES,
    schema,
  );

  const faqs = (result.faqs ?? []).map((f) => ({
    ...f,
    citations: (f.citations ?? []).filter((n) => n >= 1 && n <= evidence.length),
  }));
  return { faqs, evidence };
}
