import { CHUNK_SIZE, CHUNK_OVERLAP } from "./config";

export interface RawChunk {
  text: string;
  start: number;
  end: number;
}

/**
 * Paragraph-aware splitter. It packs whole paragraphs (separated by blank lines) into
 * chunks up to `size`, so each chunk stays on a single topic and a citation lands on a
 * tight, relevant passage rather than a multi-section blob. Paragraphs longer than `size`
 * are hard-split with overlap.
 *
 * Character offsets are absolute in the input string — and the caller stores that exact
 * string as the source text — so clicking a citation highlights the precise passage.
 */
export function chunkText(
  text: string,
  size: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP,
): RawChunk[] {
  if (!text || text.trim().length === 0) return [];

  // 1. Split into paragraphs, tracking each one's offset in the input.
  const paragraphs: RawChunk[] = [];
  const pushPara = (from: number, to: number) => {
    const raw = text.slice(from, to);
    const trimmed = raw.trim();
    if (!trimmed) return;
    const start = from + raw.indexOf(trimmed);
    paragraphs.push({ text: trimmed, start, end: start + trimmed.length });
  };
  const splitter = /\n{2,}/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = splitter.exec(text)) !== null) {
    pushPara(cursor, match.index);
    cursor = splitter.lastIndex;
  }
  pushPara(cursor, text.length);

  // 2. Pack paragraphs into chunks up to `size`; hard-split any oversized paragraph.
  const chunks: RawChunk[] = [];
  let current: RawChunk | null = null;
  const flush = () => {
    if (current) {
      chunks.push(current);
      current = null;
    }
  };
  for (const p of paragraphs) {
    if (p.end - p.start > size) {
      flush();
      chunks.push(...hardSplit(text, p.start, p.end, size, overlap));
    } else if (!current) {
      current = { ...p };
    } else if (p.end - current.start <= size) {
      // Extend the current chunk to absorb this paragraph (they're contiguous in `text`).
      current = { text: text.slice(current.start, p.end), start: current.start, end: p.end };
    } else {
      flush();
      current = { ...p };
    }
  }
  flush();
  return chunks;
}

/** Split one long span into size-bounded windows with overlap, preferring sentence/word
 *  boundaries. Offsets are absolute in `text`. */
function hardSplit(
  text: string,
  spanStart: number,
  spanEnd: number,
  size: number,
  overlap: number,
): RawChunk[] {
  const out: RawChunk[] = [];
  let start = spanStart;
  while (start < spanEnd) {
    let end = Math.min(start + size, spanEnd);
    if (end < spanEnd) {
      const b = lastBoundary(text.slice(start, end), size);
      if (b !== null) end = start + b;
    }
    const raw = text.slice(start, end);
    const trimmed = raw.trim();
    if (trimmed) {
      const s = start + raw.indexOf(trimmed);
      out.push({ text: trimmed, start: s, end: s + trimmed.length });
    }
    if (end >= spanEnd) break;
    start = Math.max(end - overlap, start + 1);
  }
  return out;
}

function lastBoundary(window: string, size: number): number | null {
  let best: number | null = null;
  for (const c of [". ", ".\n", "? ", "! ", "; ", "\n"]) {
    const idx = window.lastIndexOf(c);
    if (idx + c.length > (best ?? -1)) best = idx === -1 ? best : idx + c.length;
  }
  return best !== null && best > size * 0.5 ? best : null;
}
