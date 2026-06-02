import { NextResponse } from "next/server";
import { ingest } from "@/lib/ingest";
import { extractRawText } from "@/lib/extract";
import { getSources } from "@/lib/store";
import { SAMPLE_TEXT, SAMPLE_TITLE } from "@/lib/sample";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Load the bundled sample document so a reviewer can try the app instantly. Idempotent:
 *  if the sample is already loaded, it returns the existing source instead of duplicating. */
export async function POST() {
  try {
    const existing = (await getSources()).find((s) => s.title === SAMPLE_TITLE);
    if (existing) {
      return NextResponse.json({ source: summarize(existing), alreadyLoaded: true });
    }
    const { source } = await ingest(extractRawText(SAMPLE_TITLE, SAMPLE_TEXT), "text");
    return NextResponse.json({ source: summarize(source), alreadyLoaded: false });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load sample." },
      { status: 500 },
    );
  }
}

function summarize(s: { id: string; title: string; type: string; origin?: string; createdAt: number }) {
  return { id: s.id, title: s.title, type: s.type, origin: s.origin, createdAt: s.createdAt };
}
