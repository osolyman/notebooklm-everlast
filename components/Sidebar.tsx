"use client";

import { useRef, useState } from "react";
import {
  addPdfSource,
  addTextSource,
  addUrlSource,
  clearAllSources,
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
  onLoadSample,
}: {
  sources: SourceSummary[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onChanged: () => void;
  onLoadSample: () => Promise<void>;
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

  const inputCls =
    "min-w-0 flex-1 rounded-md border border-gray-300 px-2.5 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-200">Sources</h2>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">
            What the assistant may use.
          </p>
        </div>
        {sources.length > 0 && (
          <button
            onClick={() => run("clearall", clearAllSources)}
            disabled={!!busy}
            className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-50 dark:text-zinc-500 dark:hover:text-red-400"
          >
            {busy === "clearall" ? "Clearing…" : "Clear all"}
          </button>
        )}
      </div>

      {/* Add controls */}
      <div className="space-y-2 border-b border-gray-200 px-4 py-3 dark:border-zinc-800">
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
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          {busy === "pdf" ? "Reading PDF…" : "＋ Upload PDF"}
        </button>

        <div className="flex gap-1.5">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a web URL"
            className={inputCls}
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
            className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ＋ Paste text instead
          </button>
        ) : (
          <div className="space-y-1.5 rounded-md bg-gray-50 p-2 dark:bg-zinc-800/60">
            <input
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="Title"
              className={inputCls + " w-full"}
            />
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your text…"
              rows={4}
              className={inputCls + " w-full"}
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
                className="rounded px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {sources.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <p className="text-xs text-gray-400 dark:text-zinc-500">No sources yet.</p>
            <button
              onClick={() => run("sample", onLoadSample)}
              disabled={!!busy}
              className="mt-2 text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50 dark:text-indigo-400"
            >
              {busy === "sample" ? "Loading sample…" : "Load a sample document"}
            </button>
          </div>
        ) : (
          <ul className="space-y-1">
            {sources.map((s) => (
              <li
                key={s.id}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-800/60"
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => onToggle(s.id)}
                  className="h-4 w-4 shrink-0 accent-indigo-600"
                />
                <span className="shrink-0">{TYPE_ICON[s.type]}</span>
                <span
                  className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-zinc-300"
                  title={s.title}
                >
                  {s.title}
                </span>
                <button
                  onClick={() => run(`del-${s.id}`, () => deleteSource(s.id))}
                  className="shrink-0 text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 dark:text-zinc-600 dark:hover:text-red-400"
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
