"use client";

import { useState } from "react";
import { buildFaq, buildSummary } from "@/lib/api";
import type { FaqItem, RetrievedChunk } from "@/lib/types";
import type { SavedItem } from "@/lib/useSaved";
import { CitationText, type CiteTarget } from "./CitationText";

export function InsightsPanel({
  selectedIds,
  hasSources,
  onCite,
  onAsk,
  onSave,
  isSaved,
  saved,
  onRemoveSaved,
}: {
  selectedIds: string[];
  hasSources: boolean;
  onCite: (t: CiteTarget) => void;
  onAsk: (q: string) => void;
  onSave: (q: string, a: string) => void;
  isSaved: (q: string) => boolean;
  saved: SavedItem[];
  onRemoveSaved: (id: string) => void;
}) {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [evidence, setEvidence] = useState<RetrievedChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Summary state.
  const [summary, setSummary] = useState<string>("");
  const [summaryEvidence, setSummaryEvidence] = useState<RetrievedChunk[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  async function generateSummary() {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await buildSummary(selectedIds);
      setSummary(res.summary);
      setSummaryEvidence(res.evidence);
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : "Failed to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await buildFaq(selectedIds);
      setFaqs(res.faqs);
      setEvidence(res.evidence);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate FAQ.");
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setFaqs([]);
    setEvidence([]);
    setDone(false);
    setError(null);
  }

  function renderAnswer(text: string, citations: number[]) {
    const withMarkers =
      citations.length && !/\[\d+\]/.test(text)
        ? `${text} ${citations.map((c) => `[${c}]`).join("")}`
        : text;
    return <CitationText text={withMarkers} evidence={evidence} onCite={onCite} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-5 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-200">Insights</h2>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">
          Proactive, grounded artifacts — not just search.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {/* Summary card */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-100">Summary</h3>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">
                A grounded overview of the whole document.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {summary && (
                <button
                  onClick={() => {
                    setSummary("");
                    setSummaryEvidence([]);
                    setSummaryError(null);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  Clear
                </button>
              )}
              <button
                onClick={generateSummary}
                disabled={!hasSources || summaryLoading}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {summaryLoading ? "Summarizing…" : summary ? "Regenerate" : "Generate"}
              </button>
            </div>
          </div>

          {summaryError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{summaryError}</p>}

          {summary && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 dark:text-zinc-300">
                <CitationText text={summary} evidence={summaryEvidence} onCite={onCite} />
              </p>
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => onSave("Summary of the document", summary)}
                  disabled={isSaved("Summary of the document")}
                  className="text-xs font-medium text-gray-400 hover:text-indigo-600 disabled:text-indigo-500 dark:text-zinc-500 dark:hover:text-indigo-400"
                >
                  {isSaved("Summary of the document") ? "★ Saved" : "☆ Save"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Auto-FAQ card */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-100">Auto-FAQ</h3>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">
                The most useful Q&amp;As from your sources, each cited.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {done && (
                <button
                  onClick={clear}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                >
                  Clear
                </button>
              )}
              <button
                onClick={generate}
                disabled={!hasSources || loading}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Generating…" : done ? "Regenerate" : "Generate"}
              </button>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

          {done && faqs.length === 0 && !error && (
            <p className="mt-3 text-sm text-gray-400 dark:text-zinc-500">
              No FAQ could be generated from these sources.
            </p>
          )}

          <div className="mt-4 space-y-4">
            {faqs.map((f, i) => (
              <div
                key={i}
                className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0 dark:border-zinc-800"
              >
                <p className="text-sm font-semibold text-gray-800 dark:text-zinc-100">{f.question}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-zinc-300">
                  {renderAnswer(f.answer, f.citations)}
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => onAsk(f.question)}
                    className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    title="Run this question through the chat for a live, cited answer"
                  >
                    ↗ Ask in chat
                  </button>
                  <button
                    onClick={() => onSave(f.question, f.answer)}
                    disabled={isSaved(f.question)}
                    className="text-xs font-medium text-gray-400 hover:text-indigo-600 disabled:text-indigo-500 dark:text-zinc-500 dark:hover:text-indigo-400"
                  >
                    {isSaved(f.question) ? "★ Saved" : "☆ Save"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saved list */}
        {saved.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-zinc-100">
              Saved <span className="text-gray-400 dark:text-zinc-500">({saved.length})</span>
            </h3>
            <div className="mt-3 space-y-3">
              {saved.map((s) => (
                <div
                  key={s.id}
                  className="group border-t border-gray-100 pt-3 first:border-t-0 first:pt-0 dark:border-zinc-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-zinc-100">{s.question}</p>
                    <button
                      onClick={() => onRemoveSaved(s.id)}
                      className="shrink-0 text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 dark:text-zinc-600 dark:hover:text-red-400"
                      aria-label="Remove saved item"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-3 text-xs text-gray-500 dark:text-zinc-400">
                    {s.answer.replace(/\[\d+\]/g, "")}
                  </p>
                  <button
                    onClick={() => onAsk(s.question)}
                    className="mt-1.5 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    ↗ Ask again
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasSources && (
          <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
            Add sources to generate insights.
          </p>
        )}
      </div>
    </div>
  );
}
