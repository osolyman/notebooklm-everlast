import { extractText as extractPdfText, getDocumentProxy } from "unpdf";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";

export interface Extracted {
  title: string;
  text: string;
}

function tidy(text: string): string {
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export async function extractPdf(buffer: ArrayBuffer, filename: string): Promise<Extracted> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractPdfText(pdf, { mergePages: true });
  return { title: filename.replace(/\.pdf$/i, ""), text: tidy(text) };
}

/**
 * Fetch a web page and extract its readable article text. Tries Readability first
 * (drops nav/ads/boilerplate), falls back to crude cheerio body text if that fails.
 */
export async function extractUrl(url: string): Promise<Extracted> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; NotebookLM-clone/1.0)" },
  });
  if (!res.ok) throw new Error(`Could not fetch URL (HTTP ${res.status}).`);
  const html = await res.text();

  const dom = new JSDOM(html, { url });
  const article = new Readability(dom.window.document).parse();
  if (article?.textContent && article.textContent.trim().length > 200) {
    return { title: article.title || url, text: tidy(article.textContent) };
  }

  // Fallback: strip scripts/styles and take the body text.
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, footer, header").remove();
  const text = tidy($("body").text());
  if (text.length < 50) throw new Error("No readable text found at that URL.");
  const title = $("title").first().text().trim() || url;
  return { title, text };
}

export function extractRawText(title: string, text: string): Extracted {
  return { title: title.trim() || "Pasted text", text: tidy(text) };
}
