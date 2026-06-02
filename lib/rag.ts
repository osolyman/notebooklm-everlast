import { embedOne, generateJson } from "./gemini";
import { search, sampleChunks } from "./store";
import { SIMILARITY_FLOOR, TOP_K } from "./config";
import type { ChatResponse, FaqItem, RetrievedChunk } from "./types";

const GROUNDING_RULES = `You are a careful research assistant for a NotebookLM-style app.
You answer ONLY from the numbered SOURCES provided. Rules:
- Use only information present in the sources. Never use outside knowledge.
- Cite every claim inline with bracketed numbers like [1] or [2][4], matching the source numbers.
- If the sources do not contain enough information to answer, set "sufficient_evidence" to false
  and briefly say what is missing. Do NOT guess or fill gaps.
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
): Promise<ChatResponse> {
  const queryEmbedding = await embedOne(question, "RETRIEVAL_QUERY");
  const evidence = await search(queryEmbedding, TOP_K, sourceIds);

  if (evidence.length === 0) {
    return {
      answered: false,
      answer: "There are no sources yet. Add a document, paste text, or add a URL to get started.",
      evidence: [],
      citations: [],
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
    };
  }

  const prompt = `SOURCES:\n${renderSources(evidence)}\n\nQUESTION: ${question}`;
  const schema = {
    type: "OBJECT",
    properties: {
      sufficient_evidence: { type: "BOOLEAN" },
      answer: { type: "STRING" },
      used_chunks: { type: "ARRAY", items: { type: "INTEGER" } },
    },
    required: ["sufficient_evidence", "answer", "used_chunks"],
  };

  const result = await generateJson<{
    sufficient_evidence: boolean;
    answer: string;
    used_chunks: number[];
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
    };
  }

  const valid = (result.used_chunks ?? []).filter((n) => n >= 1 && n <= evidence.length);
  return {
    answered: true,
    answer: result.answer.trim(),
    evidence,
    citations: Array.from(new Set(valid)),
  };
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
