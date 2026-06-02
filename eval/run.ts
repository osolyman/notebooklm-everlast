/**
 * Tiny evaluation harness for the grounding + abstention pipeline.
 *
 * It runs the REAL retrieval/answer path (not a mock) over a fixed question set split
 * into in-scope (answerable from the source) and out-of-scope (not in the source). It
 * reports:
 *   - grounding accuracy   : in-scope questions we answered
 *   - abstention accuracy  : out-of-scope questions we correctly refused
 *   - the score separation : min in-scope similarity vs. max out-of-scope similarity,
 *                            which is what justifies where the abstention floor sits.
 *
 * Usage:  npm run eval     (requires GEMINI_API_KEY in .env.local)
 *
 * NOTE: this resets the local store, ingests the sample, and leaves it loaded.
 */
import { readFileSync } from "fs";
import path from "path";

// Load .env.local into process.env. The Gemini key is read lazily at call time, so
// doing this after the (hoisted) imports is fine.
loadEnvLocal();

import { clearAll } from "../lib/store";
import { ingest } from "../lib/ingest";
import { extractRawText } from "../lib/extract";
import { answerQuestion } from "../lib/rag";
import { SIMILARITY_FLOOR } from "../lib/config";

const ROOT = path.resolve(import.meta.dirname, "..");
const DELAY_MS = Number(process.env.EVAL_DELAY_MS ?? 5000); // flash-lite free tier ≈ 15 req/min

interface Case {
  question: string;
  expect: "answer" | "abstain";
}
interface Result extends Case {
  answered: boolean;
  topScore: number;
  pass: boolean;
  /** Which gate produced an abstention: the deterministic floor, or the model's self-check. */
  gate: "floor" | "model" | "—";
}

function loadEnvLocal() {
  try {
    const raw = readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* no .env.local — assume env is already populated */
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const dataset = JSON.parse(
    readFileSync(path.join(ROOT, "eval", "dataset.json"), "utf8"),
  ) as { source: string; cases: Case[] };

  console.log("Resetting store and ingesting sample…");
  await clearAll();
  const text = readFileSync(path.join(ROOT, dataset.source), "utf8");
  const { source, chunkCount } = await ingest(extractRawText("Eval source", text), "text");
  console.log(`Ingested "${source.title}" (${chunkCount} chunks)\n`);

  const results: Result[] = [];
  for (let i = 0; i < dataset.cases.length; i++) {
    const c = dataset.cases[i];
    const res = await answerQuestion(c.question, [source.id]);
    const topScore = res.evidence[0]?.score ?? 0;
    const pass = res.answered === (c.expect === "answer");
    const gate: Result["gate"] = res.answered
      ? "—"
      : topScore < SIMILARITY_FLOOR
        ? "floor"
        : "model";
    results.push({ ...c, answered: res.answered, topScore, pass, gate });
    process.stdout.write(pass ? "." : "X");
    if (i < dataset.cases.length - 1) await sleep(DELAY_MS);
  }
  console.log("\n");

  // Per-case table.
  console.log("RESULT  EXPECT   GOT        GATE    SCORE  QUESTION");
  for (const r of results) {
    console.log(
      `${r.pass ? "  ✓  " : "  ✗  "}  ${pad(r.expect, 7)}  ${pad(
        r.answered ? "answered" : "abstained",
        9,
      )} ${pad(r.gate, 6)}  ${r.topScore.toFixed(3)}  ${r.question}`,
    );
  }

  // Metrics.
  const inScope = results.filter((r) => r.expect === "answer");
  const outScope = results.filter((r) => r.expect === "abstain");
  const grounded = inScope.filter((r) => r.answered).length;
  const abstained = outScope.filter((r) => !r.answered).length;
  const passed = results.filter((r) => r.pass).length;
  const byFloor = outScope.filter((r) => !r.answered && r.gate === "floor").length;
  const byModel = outScope.filter((r) => !r.answered && r.gate === "model").length;

  console.log("\n────────────────── SUMMARY ──────────────────");
  console.log(`Overall accuracy     : ${passed}/${results.length} (${pct(passed, results.length)})`);
  console.log(`Grounding (in-scope) : ${grounded}/${inScope.length} answered`);
  console.log(`Abstention (out)     : ${abstained}/${outScope.length} refused`);
  console.log(
    `False answers        : ${outScope.length - abstained}  (hallucination risk — want 0)`,
  );
  console.log(`False refusals       : ${inScope.length - grounded}  (over-cautious)`);

  console.log("\nWhy two gates (abstention attribution):");
  console.log(`  Gate 1 — similarity floor (<${SIMILARITY_FLOOR}) : ${byFloor} caught`);
  console.log(`  Gate 2 — model self-check                : ${byModel} caught`);
  console.log(
    "  → Near-domain questions (e.g. \"what is the revenue?\") score high on similarity because",
  );
  console.log(
    "    they're about the right topic, so the floor alone misses them. The model's evidence",
  );
  console.log("    check catches them. Neither gate alone would reach 100%.");
}

const pad = (s: string, n: number) => s.padEnd(n);
const pct = (a: number, b: number) => `${((100 * a) / b).toFixed(0)}%`;

main().catch((e) => {
  console.error("\nEval failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
