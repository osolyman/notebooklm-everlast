import { NextRequest, NextResponse } from "next/server";
import { getSource } from "@/lib/store";

export const runtime = "nodejs";

/** Fetch a single source including its full text, for the citation/highlight view. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const source = await getSource(id);
  if (!source) return NextResponse.json({ error: "Source not found." }, { status: 404 });
  return NextResponse.json({ source });
}
