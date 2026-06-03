"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildAudio, buildFaq, buildSummary } from "@/lib/api";
import type { Artifact, ArtifactType } from "@/lib/useArtifacts";
import { CitationText, type CiteTarget } from "./CitationText";

const ICON: Record<ArtifactType, string> = { summary: "📄", faq: "❓", note: "📌", audio: "🎧" };

type GenType = "summary" | "faq" | "audio";

export function StudioPanel({
  selectedIds,
  hasSources,
  sourceCount,
  onCite,
  onAsk,
  artifacts,
  onAdd,
  onRemove,
  onRename,
}: {
  selectedIds: string[];
  hasSources: boolean;
  sourceCount: number;
  onCite: (t: CiteTarget) => void;
  onAsk: (q: string) => void;
  artifacts: Artifact[];
  onAdd: (a: Omit<Artifact, "id" | "createdAt">) => Artifact;
  onRemove: (id: string) => void;
  onRename: (id: string, title: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [generating, setGenerating] = useState<GenType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");

  const open = artifacts.find((a) => a.id === openId) ?? null;

  async function generate(type: GenType) {
    setGenerating(type);
    setError(null);
    try {
      if (type === "summary") {
        const res = await buildSummary(selectedIds);
        const a = onAdd({ type, title: "Summary", sourceCount, summary: res.summary, evidence: res.evidence });
        setOpenId(a.id);
      } else if (type === "faq") {
        const res = await buildFaq(selectedIds);
        const a = onAdd({ type, title: "Auto-FAQ", sourceCount, faqs: res.faqs, evidence: res.evidence });
        setOpenId(a.id);
      } else {
        const res = await buildAudio(selectedIds);
        const a = onAdd({ type, title: "Audio Overview", sourceCount, script: res.script });
        setOpenId(a.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(null);
    }
  }

  function startRename(a: Artifact) {
    setRenamingId(a.id);
    setRenameText(a.title);
    setMenuId(null);
  }
  function commitRename() {
    if (renamingId && renameText.trim()) onRename(renamingId, renameText.trim());
    setRenamingId(null);
  }

  // ---- Artifact viewer ----
  if (open) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-3 dark:border-zinc-800">
          <button
            onClick={() => setOpenId(null)}
            className="text-sm text-gray-400 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-200"
          >
            ← Studio
          </button>
          <span className="text-gray-300 dark:text-zinc-600">/</span>
          <span className="truncate text-sm font-semibold text-gray-800 dark:text-zinc-100">
            {ICON[open.type]} {open.title}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ArtifactBody artifact={open} onCite={onCite} onAsk={onAsk} onSaveNote={onAdd} sourceCount={sourceCount} />
        </div>
      </div>
    );
  }

  // ---- Studio home: generators + artifact cards ----
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-5 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-200">Studio</h2>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">
          Generate grounded artifacts from your sources.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Generator tiles */}
        <div className="grid grid-cols-2 gap-2">
          <GeneratorTile
            icon="📄"
            label="Summary"
            hint="Whole-document overview"
            loading={generating === "summary"}
            disabled={!hasSources || !!generating}
            onClick={() => generate("summary")}
          />
          <GeneratorTile
            icon="❓"
            label="Auto-FAQ"
            hint="Key Q&As, cited"
            loading={generating === "faq"}
            disabled={!hasSources || !!generating}
            onClick={() => generate("faq")}
          />
          <GeneratorTile
            icon="🎧"
            label="Audio Overview"
            hint="Spoken briefing"
            loading={generating === "audio"}
            disabled={!hasSources || !!generating}
            onClick={() => generate("audio")}
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {!hasSources && (
          <p className="mt-3 text-center text-xs text-gray-400 dark:text-zinc-500">
            Add sources to generate artifacts.
          </p>
        )}

        {/* Artifact cards */}
        {artifacts.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-medium text-gray-400 dark:text-zinc-500">Your artifacts</p>
            {artifacts.map((a) => (
              <div
                key={a.id}
                className="animate-in relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition hover:border-indigo-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/40"
              >
                <button
                  onClick={() => setOpenId(a.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="text-lg">{ICON[a.type]}</span>
                  <span className="min-w-0 flex-1">
                    {renamingId === a.id ? (
                      <input
                        autoFocus
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        onBlur={commitRename}
                        className="w-full rounded border border-indigo-400 bg-white px-1.5 py-0.5 text-sm text-gray-800 focus:outline-none dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    ) : (
                      <span className="block truncate text-sm font-medium text-gray-800 dark:text-zinc-100">
                        {a.title}
                      </span>
                    )}
                    <span className="block text-xs text-gray-400 dark:text-zinc-500">
                      {a.sourceCount} source{a.sourceCount === 1 ? "" : "s"} · {timeAgo(a.createdAt)}
                    </span>
                  </span>
                </button>

                <button
                  onClick={() => setMenuId(menuId === a.id ? null : a.id)}
                  className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  aria-label="Artifact menu"
                >
                  ⋮
                </button>

                {menuId === a.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                    <div className="absolute right-2 top-11 z-20 w-32 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                      <MenuItem onClick={() => { setOpenId(a.id); setMenuId(null); }}>Open</MenuItem>
                      <MenuItem onClick={() => startRename(a)}>Rename</MenuItem>
                      <MenuItem danger onClick={() => { onRemove(a.id); setMenuId(null); }}>Delete</MenuItem>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GeneratorTile({
  icon,
  label,
  hint,
  loading,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  hint: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:shadow-none dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10 dark:disabled:hover:bg-zinc-900"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-semibold text-gray-800 dark:text-zinc-100">
        {loading ? "Generating…" : label}
      </span>
      <span className="text-xs text-gray-400 dark:text-zinc-500">{hint}</span>
    </button>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 ${
        danger
          ? "text-red-600 dark:text-red-400"
          : "text-gray-700 dark:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

function ArtifactBody({
  artifact,
  onCite,
  onAsk,
  onSaveNote,
  sourceCount,
}: {
  artifact: Artifact;
  onCite: (t: CiteTarget) => void;
  onAsk: (q: string) => void;
  onSaveNote: (a: Omit<Artifact, "id" | "createdAt">) => Artifact;
  sourceCount: number;
}) {
  const ev = artifact.evidence ?? [];
  const withMarkers = (text: string, citations: number[]) =>
    citations.length && !/\[\d+\]/.test(text)
      ? `${text} ${citations.map((c) => `[${c}]`).join("")}`
      : text;

  if (artifact.type === "summary") {
    return (
      <p className="text-sm text-gray-700 dark:text-zinc-300">
        <CitationText text={artifact.summary ?? ""} evidence={ev} onCite={onCite} />
      </p>
    );
  }

  if (artifact.type === "audio") {
    return (
      <div>
        <AudioPlayer text={artifact.script ?? ""} />
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-zinc-300">
          {artifact.script}
        </p>
      </div>
    );
  }

  if (artifact.type === "faq") {
    return (
      <div className="space-y-4">
        {(artifact.faqs ?? []).map((f, i) => (
          <div key={i} className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0 dark:border-zinc-800">
            <p className="text-sm font-semibold text-gray-800 dark:text-zinc-100">{f.question}</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-zinc-300">
              <CitationText text={withMarkers(f.answer, f.citations)} evidence={ev} onCite={onCite} />
            </p>
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={() => onAsk(f.question)}
                className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                ↗ Ask in chat
              </button>
              <button
                onClick={() => onSaveNote({ type: "note", title: f.question.slice(0, 60), sourceCount, note: { question: f.question, answer: f.answer } })}
                className="text-xs font-medium text-gray-400 hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400"
              >
                ☆ Save as note
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // note
  return (
    <div>
      <p className="text-sm font-semibold text-gray-800 dark:text-zinc-100">{artifact.note?.question}</p>
      <p className="mt-2 text-sm text-gray-600 dark:text-zinc-300 whitespace-pre-wrap">
        {(artifact.note?.answer ?? "").replace(/\[\d+\]/g, "")}
      </p>
      <button
        onClick={() => onAsk(artifact.note?.question ?? "")}
        className="mt-3 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
      >
        ↗ Ask again in chat
      </button>
    </div>
  );
}

/** Plays a script with the browser's free Web Speech API. Splits into sentences and
 *  queues short utterances to avoid the Chrome long-text cutoff. */
function AudioPlayer({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const [supported, setSupported] = useState(true);
  const sentences = useMemo(() => text.match(/[^.!?]+[.!?]*\s*/g)?.filter((s) => s.trim()) ?? [text], [text]);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => window.speechSynthesis?.cancel();
  }, []);

  function play() {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (state === "paused") {
      synth.resume();
      setState("playing");
      return;
    }
    synth.cancel();
    sentences.forEach((s, i) => {
      const u = new SpeechSynthesisUtterance(s.trim());
      u.rate = 1;
      if (i === sentences.length - 1) u.onend = () => setState("idle");
      synth.speak(u);
    });
    setState("playing");
  }

  if (!supported) {
    return <p className="text-xs text-gray-400 dark:text-zinc-500">Audio playback isn&apos;t supported in this browser.</p>;
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
      <span className="text-xl">🎧</span>
      {state !== "playing" ? (
        <button
          onClick={play}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {state === "paused" ? "▶ Resume" : "▶ Play"}
        </button>
      ) : (
        <button
          onClick={() => {
            window.speechSynthesis.pause();
            setState("paused");
          }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          ⏸ Pause
        </button>
      )}
      <button
        onClick={() => {
          window.speechSynthesis.cancel();
          setState("idle");
        }}
        disabled={state === "idle"}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
      >
        ⏹ Stop
      </button>
      <span className="ml-auto text-xs text-gray-400 dark:text-zinc-500">free browser voice</span>
    </div>
  );
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
