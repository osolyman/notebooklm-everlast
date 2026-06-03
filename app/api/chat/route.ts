import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { question, sourceIds, history } = await req.json();
    const q = String(question ?? "").trim();
    if (!q) return NextResponse.json({ error: "Empty question." }, { status: 400 });

    const result = await answerQuestion(
      q,
      Array.isArray(sourceIds) && sourceIds.length ? sourceIds : undefined,
      Array.isArray(history) ? history.slice(-4) : [],
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat failed." },
      { status: 500 },
    );
  }
}
