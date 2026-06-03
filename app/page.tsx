"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listSources, seedSample, type SourceSummary } from "@/lib/api";
import { useArtifacts } from "@/lib/useArtifacts";
import { GENERIC_QUESTIONS, SAMPLE_QUESTIONS, SAMPLE_TITLE } from "@/lib/sample";
import { Sidebar } from "@/components/Sidebar";
import { ChatPanel, type PendingAsk } from "@/components/ChatPanel";
import { StudioPanel } from "@/components/StudioPanel";
import { SourceViewer } from "@/components/SourceViewer";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { CiteTarget } from "@/components/CitationText";

export default function Home() {
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewer, setViewer] = useState<CiteTarget | null>(null);
  const [pendingAsk, setPendingAsk] = useState<PendingAsk | null>(null);
  const { artifacts, add, remove, rename } = useArtifacts();

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

  const selectedIds = useMemo(() => [...selected], [selected]);
  const hasSources = selectedIds.length > 0;

  // Saving a chat answer creates a "note" artifact in the Studio.
  const saveItem = useCallback(
    (question: string, answer: string) =>
      add({ type: "note", title: question.slice(0, 60), sourceCount: selectedIds.length, note: { question, answer } }),
    [add, selectedIds.length],
  );

  // Show sample-specific starters only when the sample is the only thing selected;
  // otherwise show generic, document-agnostic prompts.
  const starters = useMemo(() => {
    const titles = sources.filter((s) => selected.has(s.id)).map((s) => s.title);
    const onlySample = titles.length > 0 && titles.every((t) => t === SAMPLE_TITLE);
    return onlySample ? SAMPLE_QUESTIONS : GENERIC_QUESTIONS;
  }, [sources, selected]);

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-zinc-950">
      <header className="z-10 flex items-center gap-3 border-b border-gray-200/80 bg-white/70 px-5 py-2.5 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/70">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm shadow-sm shadow-indigo-500/20">
          📓
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold tracking-tight text-gray-800 dark:text-zinc-100">Notebook</h1>
          <p className="hidden text-[11px] text-gray-400 sm:block dark:text-zinc-500">
            grounded · cited · honest about uncertainty
          </p>
        </div>
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
            starters={starters}
          />
        </section>
        <section className="hidden min-h-0 bg-white md:block dark:bg-zinc-900">
          <StudioPanel
            selectedIds={selectedIds}
            hasSources={hasSources}
            sourceCount={selectedIds.length}
            onCite={setViewer}
            onAsk={askInChat}
            artifacts={artifacts}
            onAdd={add}
            onRemove={remove}
            onRename={rename}
          />
        </section>
      </main>

      <SourceViewer target={viewer} onClose={() => setViewer(null)} />
    </div>
  );
}
