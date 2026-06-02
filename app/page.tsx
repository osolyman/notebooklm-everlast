"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listSources, seedSample, type SourceSummary } from "@/lib/api";
import { useSaved } from "@/lib/useSaved";
import { Sidebar } from "@/components/Sidebar";
import { ChatPanel, type PendingAsk } from "@/components/ChatPanel";
import { InsightsPanel } from "@/components/InsightsPanel";
import { SourceViewer } from "@/components/SourceViewer";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { CiteTarget } from "@/components/CitationText";

export default function Home() {
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewer, setViewer] = useState<CiteTarget | null>(null);
  const [pendingAsk, setPendingAsk] = useState<PendingAsk | null>(null);
  const { saved, save, remove, isSaved } = useSaved();

  const refresh = useCallback(async () => {
    const list = await listSources();
    setSources(list);
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

  const loadSample = useCallback(async () => {
    await seedSample();
    await refresh();
  }, [refresh]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const askInChat = useCallback((q: string) => setPendingAsk({ q, nonce: Date.now() }), []);
  const saveItem = useCallback((question: string, answer: string) => save({ question, answer }), [save]);

  const selectedIds = useMemo(() => [...selected], [selected]);
  const hasSources = selectedIds.length > 0;

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-zinc-950">
      <header className="flex items-center gap-2 border-b border-gray-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-lg">📓</span>
        <h1 className="text-sm font-semibold text-gray-800 dark:text-zinc-100">Notebook</h1>
        <span className="hidden rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 sm:inline dark:bg-zinc-800 dark:text-zinc-400">
          grounded · cited · honest about uncertainty
        </span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[280px_1fr_380px]">
        <section className="min-h-0 border-r border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <Sidebar
            sources={sources}
            selected={selected}
            onToggle={toggle}
            onChanged={refresh}
            onLoadSample={loadSample}
          />
        </section>
        <section className="min-h-0 border-r border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-950">
          <ChatPanel
            selectedIds={selectedIds}
            hasSources={hasSources}
            onCite={setViewer}
            onLoadSample={loadSample}
            onSave={saveItem}
            pendingAsk={pendingAsk}
          />
        </section>
        <section className="hidden min-h-0 bg-white md:block dark:bg-zinc-900">
          <InsightsPanel
            selectedIds={selectedIds}
            hasSources={hasSources}
            onCite={setViewer}
            onAsk={askInChat}
            onSave={saveItem}
            isSaved={isSaved}
            saved={saved}
            onRemoveSaved={remove}
          />
        </section>
      </main>

      <SourceViewer target={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
