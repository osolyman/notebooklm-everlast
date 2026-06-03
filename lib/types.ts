// Shared domain types for the NotebookLM clone.

export type SourceType = "pdf" | "text" | "url" | "youtube";

export interface Source {
  id: string;
  title: string;
  type: SourceType;
  /** Full extracted text of the source — used to render + highlight citations. */
  text: string;
  /** Original location for url/youtube sources. */
  origin?: string;
  createdAt: number;
}

export interface Chunk {
  id: string;
  sourceId: string;
  sourceTitle: string;
  /** Ordinal position of the chunk within its source. */
  index: number;
  text: string;
  /** Character offsets into the parent source's full text (for highlight-on-citation). */
  start: number;
  end: number;
  /** Unit-normalized embedding vector. */
  embedding: number[];
}

/** A retrieved chunk with its similarity score, exposed to the UI as evidence. */
export interface RetrievedChunk {
  /** 1-based citation number shown to the model and the user. */
  n: number;
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  text: string;
  start: number;
  end: number;
  score: number;
}

export interface ChatResponse {
  /** True when the system answered; false when it abstained for lack of evidence. */
  answered: boolean;
  answer: string;
  /** Evidence the retriever surfaced — shown whether we answered or abstained. */
  evidence: RetrievedChunk[];
  /** Citation numbers the answer actually relied on. */
  citations: number[];
  /** Up to 3 suggested follow-up questions, answerable from the sources. */
  followUps: string[];
}

/** A prior turn passed back for conversational context. */
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  citations: number[];
}
