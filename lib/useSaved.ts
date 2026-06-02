"use client";

import { useCallback, useEffect, useState } from "react";

export interface SavedItem {
  id: string;
  question: string;
  answer: string;
}

const KEY = "nb_saved_items";

/** Saved FAQ/answers, persisted in localStorage so they survive reloads. */
export function useSaved() {
  const [saved, setSaved] = useState<SavedItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((items: SavedItem[]) => {
    setSaved(items);
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, []);

  const save = useCallback(
    (item: Omit<SavedItem, "id">) => {
      setSaved((prev) => {
        // De-duplicate by question text.
        if (prev.some((s) => s.question === item.question)) return prev;
        const next = [{ ...item, id: crypto.randomUUID() }, ...prev];
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [],
  );

  const remove = useCallback(
    (id: string) => persist(saved.filter((s) => s.id !== id)),
    [persist, saved],
  );

  const isSaved = useCallback(
    (question: string) => saved.some((s) => s.question === question),
    [saved],
  );

  return { saved, save, remove, isSaved };
}
