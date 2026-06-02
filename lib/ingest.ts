import { randomUUID } from "crypto";
import { chunkText } from "./chunk";
import { embed } from "./gemini";
import { addSource } from "./store";
import type { Chunk, Source, SourceType } from "./types";
import type { Extracted } from "./extract";

/**
 * Turn extracted text into an embedded, stored source: chunk it (tracking offsets),
 * embed the chunks as documents, and persist. Returns a lightweight summary.
 */
export async function ingest(
  extracted: Extracted,
  type: SourceType,
  origin?: string,
): Promise<{ source: Source; chunkCount: number }> {
  const raw = chunkText(extracted.text);
  if (raw.length === 0) throw new Error("No text could be extracted from this source.");

  const sourceId = randomUUID();
  const source: Source = {
    id: sourceId,
    title: extracted.title,
    type,
    text: extracted.text,
    origin,
    createdAt: Date.now(),
  };

  const vectors = await embed(
    raw.map((r) => r.text),
    "RETRIEVAL_DOCUMENT",
  );

  const chunks: Chunk[] = raw.map((r, i) => ({
    id: `${sourceId}:${i}`,
    sourceId,
    sourceTitle: source.title,
    index: i,
    text: r.text,
    start: r.start,
    end: r.end,
    embedding: vectors[i],
  }));

  await addSource(source, chunks);
  return { source, chunkCount: chunks.length };
}
