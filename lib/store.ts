import { promises as fs } from "fs";
import path from "path";
import type { Chunk, RetrievedChunk, Source } from "./types";

/**
 * Transparent in-memory vector store: a plain array of chunks searched by brute-force
 * cosine similarity. At demo scale (a few thousand chunks) this is instant and — unlike a
 * managed vector DB — fully explainable. State is kept on globalThis so it survives Next's
 * dev hot-reloads, and mirrored to a JSON file so it survives a process restart.
 */
interface StoreData {
  sources: Source[];
  chunks: Chunk[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

const g = globalThis as unknown as { __nb_store?: StoreData; __nb_loaded?: boolean };

function data(): StoreData {
  if (!g.__nb_store) g.__nb_store = { sources: [], chunks: [] };
  return g.__nb_store;
}

/** Load persisted state from disk once per process. */
export async function ensureLoaded(): Promise<void> {
  if (g.__nb_loaded) return;
  g.__nb_loaded = true;
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    g.__nb_store = JSON.parse(raw) as StoreData;
  } catch {
    g.__nb_store = { sources: [], chunks: [] };
  }
}

async function persist(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(data()), "utf8");
  } catch {
    // Persistence is best-effort; in-memory state is the source of truth for the session.
  }
}

export async function addSource(source: Source, chunks: Chunk[]): Promise<void> {
  await ensureLoaded();
  data().sources.push(source);
  data().chunks.push(...chunks);
  await persist();
}

export async function deleteSource(sourceId: string): Promise<void> {
  await ensureLoaded();
  const d = data();
  d.sources = d.sources.filter((s) => s.id !== sourceId);
  d.chunks = d.chunks.filter((c) => c.sourceId !== sourceId);
  await persist();
}

export async function getSources(): Promise<Source[]> {
  await ensureLoaded();
  return data().sources.map(({ ...s }) => s);
}

export async function getSource(sourceId: string): Promise<Source | undefined> {
  await ensureLoaded();
  return data().sources.find((s) => s.id === sourceId);
}

export async function clearAll(): Promise<void> {
  await ensureLoaded();
  g.__nb_store = { sources: [], chunks: [] };
  await persist();
}

function dot(a: number[], b: number[]): number {
  let sum = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) sum += a[i] * b[i];
  return sum;
}

/**
 * Return the top-k chunks by cosine similarity (dot product of normalized vectors),
 * numbered 1..k for citation. Optionally restrict to a subset of sources.
 */
export async function search(
  queryEmbedding: number[],
  k: number,
  sourceIds?: string[],
): Promise<RetrievedChunk[]> {
  await ensureLoaded();
  const pool = sourceIds?.length
    ? data().chunks.filter((c) => sourceIds.includes(c.sourceId))
    : data().chunks;

  const scored = pool
    .map((c) => ({ c, score: dot(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return scored.map(({ c, score }, i) => ({
    n: i + 1,
    chunkId: c.id,
    sourceId: c.sourceId,
    sourceTitle: c.sourceTitle,
    text: c.text,
    start: c.start,
    end: c.end,
    score,
  }));
}

export async function chunkCount(): Promise<number> {
  await ensureLoaded();
  return data().chunks.length;
}

/**
 * A representative, numbered sample of chunks for whole-corpus tasks like FAQ
 * generation — evenly spread across the corpus so the sample isn't all front-matter.
 */
export async function sampleChunks(
  limit: number,
  sourceIds?: string[],
): Promise<RetrievedChunk[]> {
  await ensureLoaded();
  const pool = sourceIds?.length
    ? data().chunks.filter((c) => sourceIds.includes(c.sourceId))
    : data().chunks;

  let picked: Chunk[];
  if (pool.length <= limit) {
    picked = pool;
  } else {
    const step = pool.length / limit;
    picked = Array.from({ length: limit }, (_, i) => pool[Math.floor(i * step)]);
  }

  return picked.map((c, i) => ({
    n: i + 1,
    chunkId: c.id,
    sourceId: c.sourceId,
    sourceTitle: c.sourceTitle,
    text: c.text,
    start: c.start,
    end: c.end,
    score: 1,
  }));
}
