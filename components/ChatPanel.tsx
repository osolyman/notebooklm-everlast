"use client";

import { useEffect, useRef, useState } from "react";
import { ask } from "@/lib/api";
import type { ChatResponse } from "@/lib/types";
import type { Starter } from "@/lib/sample";
import { CitationText, type CiteTarget } from "./CitationText";

interface UserMsg {
  role: "user";
  text: string;
}
interface AssistantMsg {
  role: "assistant";
  data: ChatResponse;
  question: string;
}
type Msg = UserMsg | AssistantMsg;

export interface PendingAsk {
  q: string;
  nonce: number;
}

export function ChatPanel({
  selectedIds,
  hasSources,
  onCite,
  onLoadSample,
  onSave,
  pendingAsk,
  starters,
}: {
  selectedIds: string[];
  hasSources: boolean;
  onCite: (t: CiteTarget) => void;
  onLoadSample: () => Promise<void>;
  onSave: (question: string, answer: string) => void;
  pendingAsk: PendingAsk | null;
  starters: Starter[];
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastNonce = useRef<number>(0);

  const scrollToBottom = () =>
    requestAnimationFrame(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight));

  async function send(textArg?: string) {
    const q = (textArg ?? input).trim();
    if (!q || loading) return;
    // Build conversational history from prior turns (before adding this one).
    const history = messages.map((m) =>
      m.role === "user"
        ? { role: "user" as const, content: m.text }
        : { role: "assistant" as const, content: m.data.answer },
    );
    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    scrollToBottom();
    try {
      const data = await ask(q, selectedIds, history);
      setMessages((m) => [...m, { role: "assistant", data, question: q }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed.");
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  // Allow other panels (e.g. the FAQ) to ask a question in the chat.
  useEffect(() => {
    if (pendingAsk && pendingAsk.nonce !== lastNonce.current) {
      lastNonce.current = pendingAsk.nonce;
      send(pendingAsk.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAsk]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-zinc-200">Chat</h2>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">
            Grounded in your sources. Weak evidence → it says so.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            Clear chat
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <EmptyState
            hasSources={hasSources}
            starters={starters}
            onLoadSample={onLoadSample}
            onPick={(q) => send(q)}
          />
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end animate-in">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-2 text-sm text-white shadow-sm shadow-indigo-600/20">
                {m.text}
              </div>
            </div>
          ) : (
            <AssistantBubble
              key={i}
              data={m.data}
              question={m.question}
              onCite={onCite}
              onSave={onSave}
            />
          ),
        )}
        {!loading && <FollowUps messages={messages} onPick={(q) => send(q)} />}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-zinc-500">
            <Dot /> <Dot /> <Dot /> searching your sources…
          </div>
        )}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>

      <div className="border-t border-gray-200 p-3 dark:border-zinc-800">
        <div className="mb-1.5 flex items-center gap-1.5 px-0.5 text-xs text-gray-400 dark:text-zinc-500">
          <span>📄</span>
          <span>
            {hasSources
              ? `Answering from ${selectedIds.length} source${selectedIds.length === 1 ? "" : "s"}`
              : "No sources selected — pick at least one on the left"}
          </span>
        </div>
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
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none disabled:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900"
          />
          <button
            onClick={() => send()}
            disabled={!hasSources || loading || !input.trim()}
            className="h-[42px] shrink-0 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function AssistantBubble({
  data,
  question,
  onCite,
  onSave,
}: {
  data: ChatResponse;
  question: string;
  onCite: (t: CiteTarget) => void;
  onSave: (q: string, a: string) => void;
}) {
  const [saved, setSaved] = useState(false);

  // Ensure an inline clickable citation even if the model omitted the [n] marker.
  const answerText =
    data.answered && data.citations.length && !/\[\d+\]/.test(data.answer)
      ? `${data.answer} ${data.citations.map((c) => `[${c}]`).join("")}`
      : data.answer;

  // Show only the source(s) the answer actually relied on — not every retrieved chunk.
  const shownEvidence = data.answered
    ? data.citations.length
      ? data.evidence.filter((e) => data.citations.includes(e.n))
      : data.evidence.slice(0, 1)
    : data.evidence;

  return (
    <div className="flex justify-start animate-in">
      <div className="max-w-[90%] space-y-3">
        <div
          className={`rounded-2xl rounded-bl-sm px-4 py-3 text-sm ${
            data.answered
              ? "bg-white text-gray-800 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
              : "border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
          }`}
        >
          {!data.answered && (
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              ⚠ Not enough evidence
            </div>
          )}
          <CitationText text={answerText} evidence={data.evidence} onCite={onCite} />
        </div>

        {shownEvidence.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400 dark:text-zinc-500">
              {data.answered
                ? shownEvidence.length > 1
                  ? "Sources"
                  : "Source"
                : "Closest related material"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {shownEvidence.map((e) => (
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
                  className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-indigo-500/50 dark:hover:text-indigo-300"
                  title={`Relevance ${(e.score * 100).toFixed(0)}% — click to view`}
                >
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">[{e.n}]</span>
                  <span className="max-w-40 truncate">{e.sourceTitle}</span>
                  <span className="text-gray-400 dark:text-zinc-500">{(e.score * 100).toFixed(0)}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {data.answered && (
          <button
            onClick={() => {
              onSave(question, data.answer);
              setSaved(true);
            }}
            disabled={saved}
            className="text-xs font-medium text-gray-400 hover:text-indigo-600 disabled:text-indigo-500 dark:text-zinc-500 dark:hover:text-indigo-400"
          >
            {saved ? "★ Saved" : "☆ Save this answer"}
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  hasSources,
  starters,
  onLoadSample,
  onPick,
}: {
  hasSources: boolean;
  starters: Starter[];
  onLoadSample: () => Promise<void>;
  onPick: (q: string) => void;
}) {
  const [loadingSample, setLoadingSample] = useState(false);

  return (
    <div className="mx-auto mt-10 max-w-md text-center">
      <div className="text-3xl">💬</div>
      <h3 className="mt-2 text-sm font-semibold text-gray-700 dark:text-zinc-200">
        {hasSources ? "Ask your sources anything" : "Try it in one click"}
      </h3>
      <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
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
          <p className="mt-2 text-xs text-gray-400 dark:text-zinc-500">
            …or add your own PDF, URL, or text on the left.
          </p>
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-stretch gap-2 text-left">
          <p className="text-center text-xs font-medium text-gray-400 dark:text-zinc-500">
            Try one of these:
          </p>
          {starters.map((s) => (
            <button
              key={s.q}
              onClick={() => onPick(s.q)}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10"
            >
              <span>{s.q}</span>
              {s.kind === "abstains" && (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
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

function FollowUps({ messages, onPick }: { messages: Msg[]; onPick: (q: string) => void }) {
  const last = messages[messages.length - 1];
  if (!last || last.role !== "assistant" || last.data.followUps.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-gray-400 dark:text-zinc-500">Suggested follow-ups</p>
      <div className="flex flex-col items-start gap-1.5">
        {last.data.followUps.map((q, i) => (
          <button
            key={i}
            onClick={() => onPick(q)}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-left text-xs text-gray-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-500/50 dark:hover:text-indigo-300"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function Dot() {
  return <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400 dark:bg-zinc-500" />;
}
