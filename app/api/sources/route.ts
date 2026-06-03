import { NextRequest, NextResponse } from "next/server";
import { extractPdf, extractRawText, extractUrl, extractYouTube, isYouTubeUrl } from "@/lib/extract";
import { ingest } from "@/lib/ingest";
import { clearAll, deleteSource, getSources } from "@/lib/store";

export const runtime = "nodejs";

/** List all sources (without their full text / embeddings). */
export async function GET() {
  const sources = await getSources();
  return NextResponse.json({
    sources: sources.map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      origin: s.origin,
      createdAt: s.createdAt,
    })),
  });
}

/** Add a source: multipart (PDF file) or JSON ({ type: "text"|"url", ... }). */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided." }, { status: 400 });
      }
      const extracted = await extractPdf(await file.arrayBuffer(), file.name);
      const { source, chunkCount } = await ingest(extracted, "pdf");
      return NextResponse.json({ source: summarize(source), chunkCount });
    }

    const body = await req.json();
    if (body.type === "url") {
      const url = String(body.url ?? "").trim();
      if (!url) return NextResponse.json({ error: "Missing URL." }, { status: 400 });
      if (isYouTubeUrl(url)) {
        const extracted = await extractYouTube(url);
        const { source, chunkCount } = await ingest(extracted, "youtube", url);
        return NextResponse.json({ source: summarize(source), chunkCount });
      }
      const extracted = await extractUrl(url);
      const { source, chunkCount } = await ingest(extracted, "url", url);
      return NextResponse.json({ source: summarize(source), chunkCount });
    }

    if (body.type === "text") {
      const text = String(body.text ?? "").trim();
      if (!text) return NextResponse.json({ error: "Missing text." }, { status: 400 });
      const extracted = extractRawText(String(body.title ?? "Pasted text"), text);
      const { source, chunkCount } = await ingest(extracted, "text");
      return NextResponse.json({ source: summarize(source), chunkCount });
    }

    return NextResponse.json({ error: "Unsupported source type." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add source." },
      { status: 500 },
    );
  }
}

/** Delete a source by ?id=, or all sources with ?all=true. */
export async function DELETE(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  if (params.get("all") === "true") {
    await clearAll();
    return NextResponse.json({ ok: true });
  }
  const id = params.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  await deleteSource(id);
  return NextResponse.json({ ok: true });
}

function summarize(s: { id: string; title: string; type: string; origin?: string; createdAt: number }) {
  return { id: s.id, title: s.title, type: s.type, origin: s.origin, createdAt: s.createdAt };
}
