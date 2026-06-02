"use client";

import { useRef, useState } from "react";
import { ask } from "@/lib/api";
import type { ChatResponse } from "@/lib/types";
import { SAMPLE_QUESTIONS } from "@/lib/sample";
import { CitationText, type CiteTarget } from "./CitationText";

interface UserMsg {
  role: "user";
  text: string;
}
interface AssistantMsg {
  role: "assistant";
  data: ChatResponse;
}
type Msg = UserMsg | AssistantMsg;

export function ChatPanel({
  selectedIds,
  hasSources,
  onCite,
  onLoadSample,
}: {
  selectedIds: string[];
  hasSources: boolean;
  onCite: (t: CiteTarget) => void;
  onLoadSample: () => Promise<void>;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(textArg?: string) {
    const q = (textArg ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    requestAnimationFrame(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight));
    try {
      const data = await ask(q, selectedIds);
      setMessages((m) => [...m, { role: "assistant", data }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight));
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-5 py-3">
        <h2 className="text-sm font-semibold text-gray-700">Chat</h2>
        <p className="mt-0.5 text-xs text-gray-400">
          Answers are grounded in your sources. If the evidence is weak, the assistant says so.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <EmptyState hasSources={hasSources} onLoadSample={onLoadSample} onPick={(q) => send(q)} />
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2 text-sm text-white">
                {m.text}
              </div>
            </div>
          ) : (
            <AssistantBubble key={i} data={m.data} onCite={onCite} />
          ),
        )}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Dot /> <Dot /> <Dot /> searching your sources…
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="border-t border-gray-200 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={hasSources ? "Ask a question about your sources…" : "Add a source first…"}
            disabled={!hasSources || loading}
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none disabled:bg-gray-50"
          />
          <button
            onClick={() => send()}
            disabled={!hasSources || loading || !input.trim()}
            className="h-[42px] shrink-0 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function AssistantBubble({ data, onCite }: { data: ChatResponse; onCite: (t: CiteTarget) => void }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-3">
        <div
          className={`rounded-2xl rounded-bl-sm px-4 py-3 text-sm ${
            data.answered
              ? "bg-white text-gray-800 shadow-sm"
              : "border border-amber-300 bg-amber-50 text-amber-900"
          }`}
        >
          {!data.answered && (
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
              ⚠ Not enough evidence
            </div>
          )}
          <CitationText text={data.answer} evidence={data.evidence} onCite={onCite} />
        </div>

        {data.evidence.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400">
              {data.answered ? "Evidence" : "Closest related material"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.evidence.map((e) => (
                <button
                  key={e.chunkId}
                  onClick={() =>
                    onCite({
                      sourceId: e.sourceId,
                      sourceTitle: e.sourceTitle,
                      start: e.start,
                      end: e.end,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-700"
                  title={`Relevance ${(e.score * 100).toFixed(0)}% — click to view`}
                >
                  <span className="font-semibold text-indigo-600">[{e.n}]</span>
                  <span className="max-w-40 truncate">{e.sourceTitle}</span>
                  <span className="text-gray-400">{(e.score * 100).toFixed(0)}%</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  hasSources,
  onLoadSample,
  onPick,
}: {
  hasSources: boolean;
  onLoadSample: () => Promise<void>;
  onPick: (q: string) => void;
}) {
  const [loadingSample, setLoadingSample] = useState(false);

  return (
    <div className="mx-auto mt-10 max-w-md text-center">
      <div className="text-3xl">💬</div>
      <h3 className="mt-2 text-sm font-semibold text-gray-700">
        {hasSources ? "Ask your sources anything" : "Try it in one click"}
      </h3>
      <p className="mt-1 text-xs text-gray-400">
        Every answer cites the exact passages it used. Ask something your sources don&apos;t cover and
        watch the assistant refuse rather than guess.
      </p>

      {!hasSources ? (
        <div className="mt-5">
          <button
            onClick={async () => {
              setLoadingSample(true);
              try {
                await onLoadSample();
              } finally {
                setLoadingSample(false);
              }
            }}
            disabled={loadingSample}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loadingSample ? "Loading sample…" : "📄 Load a sample document"}
          </button>
          <p className="mt-2 text-xs text-gray-400">…or add your own PDF, URL, or text on the left.</p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-stretch gap-2 text-left">
          <p className="text-center text-xs font-medium text-gray-400">Try one of these:</p>
          {SAMPLE_QUESTIONS.map((s) => (
            <button
              key={s.q}
              onClick={() => onPick(s.q)}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
            >
              <span>{s.q}</span>
              {s.kind === "abstains" && (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                  will refuse
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Dot() {
  return <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" />;
}
