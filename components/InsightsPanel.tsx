"use client";

import { useState } from "react";
import { buildFaq } from "@/lib/api";
import type { FaqItem, RetrievedChunk } from "@/lib/types";
import { CitationText, type CiteTarget } from "./CitationText";

export function InsightsPanel({
  selectedIds,
  hasSources,
  onCite,
}: {
  selectedIds: string[];
  hasSources: boolean;
  onCite: (t: CiteTarget) => void;
}) {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [evidence, setEvidence] = useState<RetrievedChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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

  // Render [n] markers in answers as citations.
  function renderAnswer(text: string, citations: number[]) {
    const withMarkers = citations.length && !/\[\d+\]/.test(text)
      ? `${text} ${citations.map((c) => `[${c}]`).join("")}`
      : text;
    return <CitationText text={withMarkers} evidence={evidence} onCite={onCite} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-5 py-3">
        <h2 className="text-sm font-semibold text-gray-700">Insights</h2>
        <p className="mt-0.5 text-xs text-gray-400">
          Proactive, grounded artifacts — not just search.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Auto-FAQ</h3>
              <p className="mt-0.5 text-xs text-gray-400">
                The 5 most useful Q&amp;As from your sources, each cited.
              </p>
            </div>
            <button
              onClick={generate}
              disabled={!hasSources || loading}
              className="shrink-0 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Generating…" : done ? "Regenerate" : "Generate"}
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          {done && faqs.length === 0 && !error && (
            <p className="mt-3 text-sm text-gray-400">No FAQ could be generated from these sources.</p>
          )}

          <div className="mt-4 space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
                <p className="text-sm font-semibold text-gray-800">{f.question}</p>
                <p className="mt-1 text-sm text-gray-600">{renderAnswer(f.answer, f.citations)}</p>
              </div>
            ))}
          </div>
        </div>

        {!hasSources && (
          <p className="mt-6 text-center text-xs text-gray-400">Add sources to generate insights.</p>
        )}
      </div>
    </div>
  );
}
