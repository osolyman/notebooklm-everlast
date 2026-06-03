import { extractText as extractPdfText, getDocumentProxy } from "unpdf";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";
import { YoutubeTranscript } from "youtube-transcript";

export interface Extracted {
  title: string;
  text: string;
}

function tidy(text: string): string {
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com\/(?:watch|shorts|embed|live)|youtu\.be\/)/i.test(url);
}

/**
 * Fetch a YouTube video's transcript and treat it as the source text — so the assistant
 * can answer about the video exactly as it does for a PDF. The video title is fetched via
 * the lightweight oEmbed endpoint. Note: YouTube often rate-limits transcript requests from
 * datacenter IPs, so this can fail on cloud hosts even when it works locally.
 */
export async function extractYouTube(url: string): Promise<Extracted> {
  let segments: { text: string }[];
  try {
    segments = await YoutubeTranscript.fetchTranscript(url);
  } catch {
    throw new Error(
      "Couldn't get a transcript for this video. It may have captions disabled, or YouTube is rate-limiting requests from the server. Try another video, or paste the transcript as text.",
    );
  }

  const text = tidy(
    segments
      .map((s) => decodeHtml(s.text))
      .join(" "),
  );
  if (text.length < 50) throw new Error("This video has no usable transcript text.");

  let title = "YouTube video";
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    );
    if (res.ok) {
      const data = (await res.json()) as { title?: string };
      if (data.title) title = data.title;
    }
  } catch {
    /* title is best-effort */
  }
  return { title, text };
}

/** Transcript fragments arrive HTML-escaped (e.g. &amp;#39;). Decode the common entities. */
function decodeHtml(s: string): string {
  return s
    .replace(/&amp;#39;|&#39;/g, "'")
    .replace(/&amp;quot;|&quot;/g, '"')
    .replace(/&amp;amp;|&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
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
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) {
    const hint =
      res.status === 429 || res.status === 403
        ? " The site is blocking automated requests — try a different URL or paste the text directly."
        : "";
    throw new Error(`Could not fetch URL (HTTP ${res.status}).${hint}`);
  }
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
