"use client";

import { useEffect, useRef, useState } from "react";
import { getSource } from "@/lib/api";
import type { CiteTarget } from "./CitationText";

/**
 * Right-side drawer that shows a source's full text with the cited passage highlighted
 * and scrolled into view — the "click a citation, see exactly where it came from" loop
 * that makes the grounding verifiable.
 */
export function SourceViewer({
  target,
  onClose,
}: {
  target: CiteTarget | null;
  onClose: () => void;
}) {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!target) return;
    setLoading(true);
    setError(null);
    getSource(target.sourceId)
      .then((s) => setText(s.text))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load source."))
      .finally(() => setLoading(false));
  }, [target]);

  useEffect(() => {
    if (!loading && markRef.current) {
      markRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [loading, text, target]);

  if (!target) return null;

  const before = text.slice(0, target.start);
  const hit = text.slice(target.start, target.end);
  const after = text.slice(target.end);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-zinc-900">
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-zinc-800">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-zinc-500">
              Source
            </p>
            <h2 className="truncate text-sm font-semibold text-gray-800 dark:text-zinc-100">
              {target.sourceTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-gray-700 dark:text-zinc-300">
          {loading && <p className="text-gray-400 dark:text-zinc-500">Loading source…</p>}
          {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
          {!loading && !error && (
            <p className="whitespace-pre-wrap leading-relaxed">
              {before}
              <mark className="citation-hit" ref={markRef as React.Ref<HTMLElement>}>
                {hit}
              </mark>
              {after}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
