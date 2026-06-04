import { GoogleGenAI } from "@google/genai";
import { EMBEDDING_MODEL, EMBEDDING_DIM, GENERATION_MODEL } from "./config";

// One or more API keys (comma-separated in GEMINI_API_KEY). Each Google account has its
// own free-tier quota, so rotating across keys multiplies the effective daily limit and
// keeps the demo alive when one key is exhausted.
function keys(): string[] {
  return (process.env.GEMINI_API_KEY ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

let keyIndex = 0;
const clients = new Map<string, GoogleGenAI>();

function ai(): GoogleGenAI {
  const ks = keys();
  if (ks.length === 0) {
    throw new Error(
      "GEMINI_API_KEY is not set. Create a free key at https://aistudio.google.com/apikey and add it to .env.local (you can add several, comma-separated).",
    );
  }
  const key = ks[keyIndex % ks.length];
  let c = clients.get(key);
  if (!c) {
    c = new GoogleGenAI({ apiKey: key });
    clients.set(key, c);
  }
  return c;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Run a call with quota resilience:
 *  - On a 429, immediately rotate to the next key (each key has its own quota).
 *  - If every key is out for the *day*, fail fast with a clear message.
 *  - If it's a transient per-minute limit on all keys, wait once and retry the cycle.
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  const ks = keys();
  let dailyOnAll = false;

  for (let cycle = 0; cycle < 2; cycle++) {
    let allDaily = true;
    for (let k = 0; k < Math.max(ks.length, 1); k++) {
      try {
        return await fn();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!/429|RESOURCE_EXHAUSTED|rate limit|quota/i.test(msg)) throw err;
        if (!/PerDay|per_day|daily/i.test(msg)) allDaily = false;
        keyIndex++; // rotate to the next key for the next attempt
      }
    }
    dailyOnAll = allDaily;
    if (dailyOnAll) break; // every key is out for today — waiting won't help
    await sleep(20000); // transient limit on all keys — wait once, then retry the cycle
  }

  if (dailyOnAll) {
    throw new Error(
      "Daily API quota reached on all configured keys. Add another key (comma-separated in GEMINI_API_KEY) or wait until midnight Pacific Time, when the free tier resets.",
    );
  }
  throw new Error(
    "The free-tier API quota is exhausted right now (rate limit) on all keys. Please wait a minute and try again.",
  );
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
