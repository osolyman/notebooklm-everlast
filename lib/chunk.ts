import { CHUNK_SIZE, CHUNK_OVERLAP } from "./config";

export interface RawChunk {
  text: string;
  start: number;
  end: number;
}

/**
 * Recursive-ish character splitter that prefers to break on paragraph, then sentence,
 * then word boundaries, while tracking each chunk's char offsets in the original text
 * so the UI can highlight the exact cited passage. Adds a small overlap between chunks
 * so context isn't lost at the seams.
 */
export function chunkText(
  text: string,
  size: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP,
): RawChunk[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (clean.length === 0) return [];
  if (clean.length <= size) return [{ text: clean, start: 0, end: clean.length }];

  const chunks: RawChunk[] = [];
  let cursor = 0;

  while (cursor < clean.length) {
    let end = Math.min(cursor + size, clean.length);

    // If we're not at the very end, try to back off to a natural boundary.
    if (end < clean.length) {
      const window = clean.slice(cursor, end);
      const boundary =
        lastIndexOfAny(window, ["\n\n", ".\n", ". ", "?\n", "? ", "!\n", "! "]) ??
        window.lastIndexOf(" ");
      // Only honor the boundary if it leaves a reasonably sized chunk.
      if (boundary !== null && boundary > size * 0.5) {
        end = cursor + boundary + 1;
      }
    }

    const slice = clean.slice(cursor, end).trim();
    if (slice.length > 0) {
      const start = clean.indexOf(slice, cursor);
      chunks.push({ text: slice, start, end: start + slice.length });
    }

    if (end >= clean.length) break;
    cursor = Math.max(end - overlap, cursor + 1);
  }

  return chunks;
}

function lastIndexOfAny(haystack: string, needles: string[]): number | null {
  let best: number | null = null;
  for (const n of needles) {
    const idx = haystack.lastIndexOf(n);
    if (idx > (best ?? -1)) best = idx;
  }
  return best;
}
