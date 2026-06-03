import { NextRequest, NextResponse } from "next/server";
import { generateAudioScript } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Generate a spoken-style overview script (played client-side with free browser TTS). */
export async function POST(req: NextRequest) {
  try {
    const { sourceIds } = await req.json().catch(() => ({}));
    const result = await generateAudioScript(
      Array.isArray(sourceIds) && sourceIds.length ? sourceIds : undefined,
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate audio overview." },
      { status: 500 },
    );
  }
}
