import type { ChatResponse, FaqItem, RetrievedChunk, Source } from "./types";

export interface SourceSummary {
  id: string;
  title: string;
  type: Source["type"];
  origin?: string;
  createdAt: number;
}

async function json<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed.");
  return data as T;
}

export async function listSources(): Promise<SourceSummary[]> {
  const data = await json<{ sources: SourceSummary[] }>(await fetch("/api/sources"));
  return data.sources;
}

export async function addTextSource(title: string, text: string): Promise<SourceSummary> {
  const res = await fetch("/api/sources", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "text", title, text }),
  });
  return (await json<{ source: SourceSummary }>(res)).source;
}

export async function addUrlSource(url: string): Promise<SourceSummary> {
  const res = await fetch("/api/sources", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "url", url }),
  });
  return (await json<{ source: SourceSummary }>(res)).source;
}

export async function addPdfSource(file: File): Promise<SourceSummary> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/sources", { method: "POST", body: form });
  return (await json<{ source: SourceSummary }>(res)).source;
}

export async function seedSample(): Promise<SourceSummary> {
  const res = await fetch("/api/seed", { method: "POST" });
  return (await json<{ source: SourceSummary }>(res)).source;
}

export async function deleteSource(id: string): Promise<void> {
  await json(await fetch(`/api/sources?id=${encodeURIComponent(id)}`, { method: "DELETE" }));
}

export async function clearAllSources(): Promise<void> {
  await json(await fetch(`/api/sources?all=true`, { method: "DELETE" }));
}

export async function getSource(id: string): Promise<Source> {
  return (await json<{ source: Source }>(await fetch(`/api/sources/${id}`))).source;
}

export async function ask(question: string, sourceIds: string[]): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question, sourceIds }),
  });
  return json<ChatResponse>(res);
}

export async function buildFaq(
  sourceIds: string[],
): Promise<{ faqs: FaqItem[]; evidence: RetrievedChunk[] }> {
  const res = await fetch("/api/insights", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sourceIds }),
  });
  return json<{ faqs: FaqItem[]; evidence: RetrievedChunk[] }>(res);
}
