import { NextRequest, NextResponse } from "next/server";
import { generateSummary } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Generate a grounded, cited summary of the current sources. */
export async function POST(req: NextRequest) {
  try {
    const { sourceIds } = await req.json().catch(() => ({}));
    const result = await generateSummary(
      Array.isArray(sourceIds) && sourceIds.length ? sourceIds : undefined,
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate summary." },
      { status: 500 },
    );
  }
}
