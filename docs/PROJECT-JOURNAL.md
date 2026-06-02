# Project Journal — Notebook (NotebookLM clone) for Everlast AI

> **Purpose of this file.** A living record of *what* I built, *how I thought*, *what I chose and
> why*, what I discovered along the way, and the talking points for the Loom video / interview. It is
> updated continuously as the project progresses, so it is always current. This is my prep document —
> by the end I want to be able to defend every decision with confidence.

_Last updated: 2026-06-02_

---

## 1. The assignment, in my words

Everlast AI asked me to build a **NotebookLM clone**, with scope and structure left **entirely up to
me**, and to send a Loom video or agent session showing *how* I work.

The open scope is the real test. They are not checking whether I can follow a spec — they are
checking whether I can **take an ambiguous problem, decide what actually matters, and ship it**. So
my first job was not coding; it was deciding *what to build and what to leave out*, and being able to
explain why.

## 2. How I thought about it (the core thesis)

**NotebookLM's real value is not file upload or a chat box — those are commodities. It's the _trust
contract_:** every answer comes only from *your* sources, every claim is verifiable via citations,
and the system is **honest when it doesn't know**. That is exactly the hard part of applied RAG
(Retrieval-Augmented Generation), and it is what separates a real knowledge tool from a glorified
ChatGPT wrapper.

So my guiding principle was: **make the core trustworthy and bulletproof, and deliberately cut
everything that looks impressive but doesn't prove engineering judgment.**

The one behavior I want a reviewer to see first: **ask it something the sources don't cover and watch
it refuse** instead of inventing an answer. Most clones will confidently hallucinate there. Mine
won't — and that restraint is the whole point.

### The business angle (why a company would care)
- A knowledge assistant that **makes things up is worse than useless** in a company — it erodes
  trust and creates risk. One that **refuses when unsure** is something employees can actually rely
  on. Trust → adoption → real time saved.
- Concrete value: faster knowledge retrieval, less time digging through documents, and answers an
  employee can verify in one click. That maps directly to "reduce workload / improve retrieval".

## 3. Decisions and rationale

Every decision has both a **business** reason and a **technical** reason.

| Decision | Business reason | Technical reason |
|---|---|---|
| **Grounded answers + verifiable citations** as the centerpiece | Trust is what makes a knowledge tool usable in a company | Demonstrates real RAG: retrieval + grounded generation + source attribution |
| **Abstain when evidence is weak** (handle uncertainty) | A system that says "I don't know" is safe to deploy; a confident liar isn't | Shows I understand LLM limits; enforced as an explicit gate, not left to chance |
| **Two independent abstention gates** (server similarity floor + model self-check) | Reliability the business can count on | Defense in depth — grounding never depends on the model's goodwill alone |
| **In-memory vector store** (no managed DB) | Faster to ship; no infra cost | At this scale brute-force cosine is instant *and* fully explainable on camera |
| **Cut Audio Overview / TTS** | Flashy but doesn't reduce workload | Mostly an API call; low engineering signal; classic time-sink |
| **Cut auth / multi-user / multiple notebooks** | Not needed to prove the value | Pure infrastructure the reviewer never sees |
| **Gemini free tier** (`flash-lite` + `gemini-embedding-001`) | Zero cost, no credit card | On-brand (real NotebookLM runs on Gemini); generous free quota |
| **`gemini-2.5-flash-lite` over `gemini-2.5-flash`** | Demo must survive multiple reviewers | flash's free daily quota capped at 20/day on this key; flash-lite's bucket is far larger |
| **429 retry with backoff in the client** | Deployed demo won't fall over under clicking | Honors the API's suggested retry delay; production-grade resilience |
| **Task-typed embeddings** (query vs document) | Better answers = better experience | Gemini optimizes retrieval when query/doc embeddings are tagged separately |
| **Tiny evaluation harness** | Proves the system works, not just "trust me" | Treating LLM output as something to *measure* is the core of production AI |

### What I deliberately did NOT build (and will say so)
Audio overview, authentication, sharing/collaboration, mobile, multiple notebooks, a managed vector
database, YouTube ingestion (kept as an optional nice-to-have). Each was a conscious cut to keep the
core rock-solid. **Naming the cuts is itself a signal of judgment.**

## 4. Architecture (one glance)

```
Source (PDF / web URL / pasted text)
  → extract text → chunk with overlap (char offsets tracked for highlighting)
  → embed chunks (Gemini, RETRIEVAL_DOCUMENT) → in-memory vector store (+ JSON file)

Question
  → embed query (RETRIEVAL_QUERY) → cosine top-k retrieval
  → GATE 1: similarity floor — if best match too weak, abstain (no model call, deterministic)
  → GATE 2: grounded generation; model self-reports if evidence is insufficient
  → answer with inline [n] citations → click to open the source + highlight the exact passage
```

Stack: **Next.js 16 (App Router, TS) + Tailwind**, one app, deployed as a long-running Node server.

## 5. Features implemented (running checklist)

- [x] **Source ingestion** — PDF upload, web URL (Readability extraction), pasted text
- [x] **Chunking** with overlap, tracking character offsets back to the source
- [x] **Embeddings** via Gemini, task-typed for query vs. document
- [x] **In-memory vector store** with brute-force cosine search + JSON-file persistence
- [x] **Grounded chat** — answers strictly from sources, with inline `[n]` citations
- [x] **Click-a-citation → open source → highlight the exact passage** (verifiable grounding)
- [x] **Evidence panel** — shows retrieved chunks with similarity % (makes grounding visible even on success)
- [x] **Two-gate abstention** — server similarity floor + model self-assessment
- [x] **Proactive auto-FAQ** — grounded, cited Q&A generated from the sources ("work with info, not just search")
- [x] **3-pane UI** — Sources | Chat | Insights, NotebookLM-style
- [x] **429 retry with backoff** in the Gemini client
- [x] **One-click sample document + starter questions** — reviewers can try it instantly; one
      starter question deliberately triggers abstention, so the differentiator is impossible to miss
- [x] **Evaluation harness** (`npm run eval`) — measures grounding + abstention accuracy
- [x] **Deployed to a public URL** — https://notebooklm-everlast.onrender.com (Render free tier),
      verified live end-to-end (ingest → grounded answer with citations → abstention)
- [ ] _Optional / if time:_ YouTube ingestion, agentic multi-hop retrieval, streaming responses

## 6. Things I discovered through testing (great video material)

- **The daily quota is the binding constraint, not the per-minute limit.** Both `gemini-2.5-flash`
  and `gemini-2.5-flash-lite` have a **20 requests/day** daily cap on this free key. Our eval (20
  questions) plus live tests exhausted the day's budget. Fix: the retry logic now detects
  `PerDayPerProjectPerModel` quota errors and **fails fast** with a clear message instead of
  retrying for ~4 minutes silently. → Video note: *"I found both the per-minute and per-day limits
  through testing and handled each differently — fast-fail for daily (unrecoverable), retry for
  per-minute (transient)."* For a multi-reviewer demo, generate a second free key as a spare.
- **The free-tier rate limit is real and tight.** `gemini-2.5-flash` was capped at **20 requests/day**
  on this key (and 5/min). I discovered this by *running my own eval and watching it 429*. Two fixes:
  (1) added **429 retry with backoff** so the deployed app stays up under bursts; (2) switched the
  default model to **`gemini-2.5-flash-lite`**, which has a much larger free daily quota.
  → Video line: *"I found the rate limit by testing, then made the client resilient and picked a
  model whose quota fits a multi-reviewer demo."*
- **The eval proved WHY two gates are needed — the single best finding so far.** I initially assumed
  retrieval similarity alone would separate answerable from unanswerable questions. **The eval showed
  it doesn't.** "Near-domain" questions that are *about* the right topic but whose answer isn't in the
  docs (e.g. *"What is Northwind's revenue?"*, *"Who is the CEO?"*, *"What health insurance?"*) score
  **high** on similarity (0.61–0.71) — higher than several legitimate in-scope questions. The
  deterministic floor can't catch those. They were caught by **Gate 2, the model's own evidence
  check.** Meanwhile clearly-unrelated questions (Tesla CEO, capital of France) scored below the floor
  and were caught cheaply by **Gate 1**, with no model call. **Neither gate alone reaches 100%.**
  → Video line: *"I assumed similarity would tell me what's answerable. My own eval disproved that —
  and that's exactly why the system has a second, semantic gate. The eval validated the architecture."*

### Eval results (2026-06-02, `gemini-2.5-flash-lite`, floor = 0.55)

```
Overall accuracy     : 20/20 (100%)
Grounding (in-scope) : 12/12 answered
Abstention (out)     : 8/8 refused
False answers (hallucinations) : 0
False refusals                 : 0

Why two gates (abstention attribution):
  Gate 1 — similarity floor (<0.55) : 2 caught   (Tesla CEO 0.519, capital of France 0.504)
  Gate 2 — model self-check         : 6 caught   (revenue 0.683, CEO 0.675, Apollo language 0.699,
                                                   robot cost 0.686, health insurance 0.706,
                                                   part-time contractor leave 0.606)
```

In-scope similarity ranged 0.575–0.816; the floor at 0.55 sits just under the lowest legitimate
question, so Gate 1 stays conservative (no false refusals) and Gate 2 does the semantic work.

## 7. Video / interview talking points

Open with the **thesis**, not a feature tour:
1. *"I started by asking what actually creates NotebookLM's value. My answer: trust — grounded,
   cited answers and honesty about uncertainty. So I invested there and cut the rest on purpose."*
2. **Demo the refusal first** (within ~90 seconds): ask something the sources don't cover → it
   abstains and shows the closest material. *"This is the most important feature."*
3. Then the happy path: grounded answer → **click a citation → see the exact highlighted passage.**
4. Show the **evidence panel with similarity scores** — grounding made visible.
5. Show the **auto-FAQ** — initiative: help me *work with* information, not just search it.
6. Tell the **rate-limit discovery story** (production thinking).
7. Show the **eval** — *"I don't just claim it abstains; I measure it: 20/20, zero hallucinations."*
   Then the punchline: *"and the eval taught me something — similarity alone can't tell what's
   answerable, which is why I built a second semantic gate."* (Strongest single moment for proving
   AI-product maturity.)
8. Close with **honest limits**: what would change at 10k documents (managed vector DB, streaming,
   caching), and the business framing (trust → adoption → time saved).

## 8. Anticipated reviewer questions (and my answers)

- **"Why no audio overview?"** — Highest wow, lowest engineering signal (mostly a TTS call). I chose
  to make the core trustworthy instead; I'd add it once the core earns it.
- **"Why an in-memory store and not pgvector/Pinecone?"** — At this scale it's identical in quality,
  instant, and fully explainable. I noted the exact upgrade path for scale.
- **"How do you stop hallucination?"** — Two gates: a deterministic similarity floor before the model
  is even called, plus the model's own sufficiency check; every claim is cited and verifiable.
- **"How do you know it works?"** — I built an eval that measures grounding and abstention accuracy
  on a labeled question set (results below).
- **"What breaks at scale?"** — In-memory store and single-process state; I'd move to a real vector
  DB, add streaming, request caching, and per-user isolation.

## 9. Open ideas / backlog
YouTube transcript ingestion · agentic multi-hop retrieval for complex questions · streaming
responses · a small "briefing doc" generator · per-source filtering already supported in the API.
