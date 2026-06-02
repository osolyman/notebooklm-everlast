# Notebook — a grounded research assistant (NotebookLM-style)

Upload your sources, ask questions, and get answers that come **only** from those sources — with
clickable citations back to the exact passage, and a refusal when the evidence isn't there.

> Take-home for Everlast AI. Built core-first in a few focused days.

---

## Why this scope (the part that matters)

The brief was deliberately open: *"build a NotebookLM clone — scope and structure are up to you."*
So the first decision was **what actually creates the value**, and to spend the time there.

NotebookLM's real differentiator isn't file upload or a chat box — those are commodities. It's the
**trust contract**: every answer is grounded in *your* material, every claim is verifiable, and the
system is honest when it doesn't know. That is exactly the hard part of applied RAG, and it's where I
invested.

So I built the core to be bulletproof and **deliberately cut** the flashier things that don't prove
more engineering skill:

| Invested in | Deliberately cut |
|---|---|
| Grounded answers with **verifiable, click-to-source citations** | Audio Overview / TTS (mostly an API call; the classic time-sink) |
| **Correct handling of uncertainty** — abstains instead of hallucinating | Auth, multi-user, sharing |
| Multi-format ingestion (PDF, web URL, pasted text) | Managed vector DB infra (unnecessary at this scale) |
| One proactive, **cited** insight (auto-FAQ) | Mobile, multiple notebooks, 50-source scale |

The single most important behavior to look at: **ask the assistant something your sources don't
cover, and watch it refuse** — showing the closest material it found instead of inventing an answer.
Most clones will confidently hallucinate here; this one won't.

## How it works

```
Source (PDF / URL / text)
  → extract text → chunk with overlap (offsets tracked for highlighting)
  → embed chunks (Gemini, task-typed) → in-memory vector store

Question
  → embed query → cosine top-k retrieval
  → GATE 1: similarity floor — if the best match is too weak, abstain (no model call)
  → GATE 2: grounded generation; model self-reports if evidence is insufficient
  → answer with inline [n] citations → click to open + highlight the exact passage
```

**Two independent abstention gates** is the deliberate bit: a deterministic server-side similarity
floor *and* the model's own self-assessment. Grounding never depends on the model's goodwill alone.

### Design choices worth noting
- **Transparent retrieval.** The vector store is a plain array searched by brute-force cosine
  similarity — at this scale it's instant, and unlike a managed vector DB it's fully inspectable. I
  can explain exactly why any chunk was retrieved.
- **Task-typed embeddings.** Documents and queries are embedded with different task types
  (`RETRIEVAL_DOCUMENT` / `RETRIEVAL_QUERY`), which measurably improves relevance.
- **Citations are first-class everywhere** — the chat answers *and* the auto-FAQ both cite their
  source chunks. Grounding is a principle, not a one-off feature.

## Tech stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS** — one app, API routes, easy deploy.
- **Google Gemini** (free tier): `gemini-2.5-flash-lite` for generation (chosen for its larger
  free-tier daily quota, so the demo survives multiple reviewers), `gemini-embedding-001` for
  embeddings. No paid services, no credit card. The client retries on rate-limit (429) errors.
- In-memory vector store with JSON-file persistence — no external database.

## Run it locally

1. Get a free Gemini API key: <https://aistudio.google.com/apikey>
2. Create `.env.local`:
   ```
   GEMINI_API_KEY=your_key_here
   ```
3. Install and start:
   ```bash
   npm install
   npm run dev
   ```
4. Open <http://localhost:3000>, add a source, and ask away.

Tunable knobs (all optional) live in `lib/config.ts` and can be overridden via env — most notably
`SIMILARITY_FLOOR`, the abstention threshold.

## Project layout

```
app/
  page.tsx              3-pane UI (Sources | Chat | Insights)
  api/sources/          add / list / delete sources (+ /[id] for full text)
  api/chat/             grounded Q&A with citations + abstention
  api/insights/         grounded, cited auto-FAQ
lib/
  rag.ts                retrieval + two-gate abstention + answer/FAQ generation
  store.ts              in-memory vector store (cosine search + persistence)
  gemini.ts             embeddings + grounded JSON generation
  chunk.ts  extract.ts  ingest.ts  config.ts  types.ts
components/             Sidebar, ChatPanel, InsightsPanel, SourceViewer, CitationText
```

## Possible next steps (intentionally out of scope here)
YouTube transcript ingestion · agentic multi-hop retrieval for complex questions · streaming
responses · an Audio Overview. Each was considered and deferred in favor of a rock-solid core.
