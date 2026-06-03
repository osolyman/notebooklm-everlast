import { GoogleGenAI } from "@google/genai";
import { EMBEDDING_MODEL, EMBEDDING_DIM, GENERATION_MODEL } from "./config";

let client: GoogleGenAI | null = null;

function ai(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Create a free key at https://aistudio.google.com/apikey and add it to .env.local",
    );
  }
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Retry on transient per-minute rate-limit (429) errors. Fails fast on daily quota
 * exhaustion (PerDay) since retrying won't help until midnight. This keeps the deployed
 * app resilient when a reviewer clicks around quickly, without hanging for minutes.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const is429 = /429|RESOURCE_EXHAUSTED|rate limit|quota/i.test(msg);
      if (!is429) throw err;
      // Daily quota exhaustion cannot be retried — fail fast with a clear message.
      if (/PerDay|per_day|daily/i.test(msg)) {
        throw new Error(
          "Daily API quota reached on the free tier. Please wait until midnight Pacific Time (when quotas reset) and try again. This is a free-tier limit of the Gemini API, not an app bug.",
        );
      }
      if (i === attempts - 1) throw err;
      const suggested = msg.match(/retry(?:Delay)?["\s:]*?([\d.]+)\s*s/i);
      const waitMs = suggested ? Math.ceil(parseFloat(suggested[1]) * 1000) + 500 : (i + 1) * 15000;
      await sleep(waitMs);
    }
  }
  throw lastErr;
}

/** L2-normalize so cosine similarity reduces to a dot product. */
function normalize(vec: number[]): number[] {
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vec.map((v) => v / norm);
}

type EmbedTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

/**
 * Embed a batch of texts. taskType lets Gemini optimize document vs. query embeddings,
 * which measurably improves retrieval relevance. Returns unit-normalized vectors.
 */
/** Gemini's embedContent allows at most 100 inputs per request. */
const EMBED_BATCH = 100;

export async function embed(texts: string[], taskType: EmbedTask): Promise<number[][]> {
  if (texts.length === 0) return [];
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH);
    const res = await withRetry(() =>
      ai().models.embedContent({
        model: EMBEDDING_MODEL,
        contents: batch,
        config: { outputDimensionality: EMBEDDING_DIM, taskType },
      }),
    );
    for (const e of res.embeddings ?? []) out.push(normalize(e.values ?? []));
  }
  return out;
}

export async function embedOne(text: string, taskType: EmbedTask): Promise<number[]> {
  const [v] = await embed([text], taskType);
  return v;
}

/**
 * Single-shot grounded generation that returns JSON matching the given schema.
 * Low temperature keeps answers faithful to the sources.
 */
export async function generateJson<T>(
  prompt: string,
  systemInstruction: string,
  responseSchema: Record<string, unknown>,
): Promise<T> {
  const res = await withRetry(() =>
    ai().models.generateContent({
      model: GENERATION_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema,
      },
    }),
  );
  const text = res.text ?? "";
  return JSON.parse(text) as T;
}
