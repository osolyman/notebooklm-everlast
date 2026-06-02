"use client";

import type { RetrievedChunk } from "@/lib/types";

export interface CiteTarget {
  sourceId: string;
  sourceTitle: string;
  start: number;
  end: number;
}

/**
 * Renders answer text, turning inline [n] markers into clickable citation chips that
 * open the cited passage in the source viewer. The number → source mapping comes from
 * the `evidence` array returned alongside the answer.
 */
export function CitationText({
  text,
  evidence,
  onCite,
}: {
  text: string;
  evidence: RetrievedChunk[];
  onCite: (target: CiteTarget) => void;
}) {
  const byN = new Map(evidence.map((e) => [e.n, e]));
  const parts = text.split(/(\[\d+\])/g);

  return (
    <span className="leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        const m = part.match(/^\[(\d+)\]$/);
        if (m) {
          const n = Number(m[1]);
          const e = byN.get(n);
          if (e) {
            return (
              <button
                key={i}
                onClick={() =>
                  onCite({ sourceId: e.sourceId, sourceTitle: e.sourceTitle, start: e.start, end: e.end })
                }
                title={`${e.sourceTitle} — click to view`}
                className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-indigo-100 px-1 align-baseline text-xs font-semibold text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30"
              >
                {n}
              </button>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
