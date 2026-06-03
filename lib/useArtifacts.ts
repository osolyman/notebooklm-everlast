"use client";

import { useCallback, useEffect, useState } from "react";
import type { FaqItem, RetrievedChunk } from "./types";

export type ArtifactType = "summary" | "faq" | "note" | "audio";

/** A generated Studio output, persisted client-side so it survives reloads — the
 *  minimized-card-that-opens-in-a-viewer pattern from NotebookLM. */
export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  createdAt: number;
  sourceCount: number;
  summary?: string;
  faqs?: FaqItem[];
  note?: { question: string; answer: string };
  script?: string;
  evidence?: RetrievedChunk[];
}

const KEY = "nb_artifacts";

export function useArtifacts() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setArtifacts(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const write = (items: Artifact[]) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  };

  const add = useCallback((a: Omit<Artifact, "id" | "createdAt">): Artifact => {
    const item: Artifact = { ...a, id: crypto.randomUUID(), createdAt: Date.now() };
    setArtifacts((prev) => {
      const next = [item, ...prev];
      write(next);
      return next;
    });
    return item;
  }, []);

  const remove = useCallback((id: string) => {
    setArtifacts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      write(next);
      return next;
    });
  }, []);

  const rename = useCallback((id: string, title: string) => {
    setArtifacts((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, title } : a));
      write(next);
      return next;
    });
  }, []);

  return { artifacts, add, remove, rename };
}
