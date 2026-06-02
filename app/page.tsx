"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listSources, type SourceSummary } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { ChatPanel } from "@/components/ChatPanel";
import { InsightsPanel } from "@/components/InsightsPanel";
import { SourceViewer } from "@/components/SourceViewer";
import type { CiteTarget } from "@/components/CitationText";

export default function Home() {
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewer, setViewer] = useState<CiteTarget | null>(null);

  const refresh = useCallback(async () => {
    const list = await listSources();
    setSources(list);
    // Keep newly added sources selected by default; drop deleted ones.
    setSelected((prev) => {
      const next = new Set(prev);
      for (const s of list) if (!prev.has(s.id)) next.add(s.id);
      for (const id of prev) if (!list.find((s) => s.id === id)) next.delete(id);
      return next;
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedIds = useMemo(() => [...selected], [selected]);
  const hasSources = selectedIds.length > 0;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-2 border-b border-gray-200 bg-white px-5 py-3">
        <span className="text-lg">📓</span>
        <h1 className="text-sm font-semibold text-gray-800">Notebook</h1>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
          grounded · cited · honest about uncertainty
        </span>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[280px_1fr_360px]">
        <section className="min-h-0 border-r border-gray-200 bg-white">
          <Sidebar sources={sources} selected={selected} onToggle={toggle} onChanged={refresh} />
        </section>
        <section className="min-h-0 border-r border-gray-200 bg-gray-50">
          <ChatPanel selectedIds={selectedIds} hasSources={hasSources} onCite={setViewer} />
        </section>
        <section className="hidden min-h-0 bg-white md:block">
          <InsightsPanel selectedIds={selectedIds} hasSources={hasSources} onCite={setViewer} />
        </section>
      </main>

      <SourceViewer target={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
