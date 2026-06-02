"use client";

import { useRef, useState } from "react";
import {
  addPdfSource,
  addTextSource,
  addUrlSource,
  deleteSource,
  type SourceSummary,
} from "@/lib/api";

const TYPE_ICON: Record<SourceSummary["type"], string> = {
  pdf: "📄",
  text: "📝",
  url: "🔗",
  youtube: "▶️",
};

export function Sidebar({
  sources,
  selected,
  onToggle,
  onChanged,
}: {
  sources: SourceSummary[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onChanged: () => void;
}) {
  const [url, setUrl] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-700">Sources</h2>
        <p className="mt-0.5 text-xs text-gray-400">Everything the assistant is allowed to use.</p>
      </div>

      {/* Add controls */}
      <div className="space-y-2 border-b border-gray-200 px-4 py-3">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) run("pdf", () => addPdfSource(f));
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={!!busy}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {busy === "pdf" ? "Reading PDF…" : "＋ Upload PDF"}
        </button>

        <div className="flex gap-1.5">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a web URL"
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-2.5 py-2 text-sm focus:border-indigo-400 focus:outline-none"
          />
          <button
            onClick={() =>
              run("url", async () => {
                await addUrlSource(url.trim());
                setUrl("");
              })
            }
            disabled={!!busy || !url.trim()}
            className="shrink-0 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy === "url" ? "…" : "Add"}
          </button>
        </div>

        {!showPaste ? (
          <button
            onClick={() => setShowPaste(true)}
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            ＋ Paste text instead
          </button>
        ) : (
          <div className="space-y-1.5 rounded-md bg-gray-50 p-2">
            <input
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
            />
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your text…"
              rows={4}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none"
            />
            <div className="flex gap-1.5">
              <button
                onClick={() =>
                  run("text", async () => {
                    await addTextSource(pasteTitle.trim() || "Pasted text", pasteText.trim());
                    setPasteTitle("");
                    setPasteText("");
                    setShowPaste(false);
                  })
                }
                disabled={!!busy || !pasteText.trim()}
                className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {busy === "text" ? "Adding…" : "Add text"}
              </button>
              <button
                onClick={() => setShowPaste(false)}
                className="rounded px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {sources.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-gray-400">
            No sources yet. Add a PDF, URL, or text to begin.
          </p>
        ) : (
          <ul className="space-y-1">
            {sources.map((s) => (
              <li
                key={s.id}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => onToggle(s.id)}
                  className="h-4 w-4 shrink-0 accent-indigo-600"
                />
                <span className="shrink-0">{TYPE_ICON[s.type]}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-gray-700" title={s.title}>
                  {s.title}
                </span>
                <button
                  onClick={() => run(`del-${s.id}`, () => deleteSource(s.id))}
                  className="shrink-0 text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                  aria-label="Delete source"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
