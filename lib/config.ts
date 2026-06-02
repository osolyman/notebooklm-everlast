// Central knobs for the RAG pipeline. Tunable via env so the demo can be calibrated
// without code changes — see README for how the abstention floor was chosen.

// flash-lite is the default: on the free tier it has a much larger daily quota than
// gemini-2.5-flash (which is capped low), so the deployed demo survives multiple reviewers.
export const GENERATION_MODEL = process.env.GENERATION_MODEL ?? "gemini-2.5-flash-lite";
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "gemini-embedding-001";

/** gemini-embedding-001 defaults to 3072 dims; 768 is plenty for this scale and faster. */
export const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM ?? 768);

/** How many chunks to retrieve per query. */
export const TOP_K = Number(process.env.TOP_K ?? 6);

/**
 * Abstention floor: if the best chunk's cosine similarity is below this, we refuse to
 * answer rather than hallucinate. This is the headline "handle uncertainty correctly"
 * behavior — enforced server-side so it never depends on the model's goodwill.
 * Calibrated empirically: related passages score ~0.6–0.85, off-topic ~0.2–0.45.
 */
export const SIMILARITY_FLOOR = Number(process.env.SIMILARITY_FLOOR ?? 0.55);

/**
 * Target chunk size and overlap, in characters. Kept fairly small so each chunk stays on
 * one topic — this makes citations land on a tight, relevant passage instead of a blob
 * spanning several sections. Overlap only applies when a single paragraph exceeds the size.
 */
export const CHUNK_SIZE = Number(process.env.CHUNK_SIZE ?? 600);
export const CHUNK_OVERLAP = Number(process.env.CHUNK_OVERLAP ?? 100);
