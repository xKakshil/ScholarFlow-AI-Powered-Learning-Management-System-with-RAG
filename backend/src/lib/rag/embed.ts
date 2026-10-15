import { EMBEDDING_DIMENSIONS, GEMINI_EMBEDDING_MODEL, getGemini } from "@/lib/gemini";

export type EmbedTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

const BATCH_SIZE = 50;

function l2normalize(v: number[]) {
  // Truncated gemini-embedding-001 vectors are not normalised.
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

export async function embedTexts(texts: string[], task: EmbedTask, title?: string): Promise<number[][]> {
  if (texts.length === 0) return [];
  const ai = getGemini();
  const out: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await ai.models.embedContent({
      model: GEMINI_EMBEDDING_MODEL,
      contents: batch,
      config: {
        taskType: task,
        outputDimensionality: EMBEDDING_DIMENSIONS,
        ...(task === "RETRIEVAL_DOCUMENT" && title ? { title } : {}),
      },
    });
    const embeddings = res.embeddings ?? [];
    if (embeddings.length !== batch.length) {
      throw new Error(`Embedding API returned ${embeddings.length} vectors for ${batch.length} inputs`);
    }
    for (const e of embeddings) {
      const values = e.values ?? [];
      if (values.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(`Expected ${EMBEDDING_DIMENSIONS}-dim embedding, got ${values.length}`);
      }
      out.push(l2normalize(values));
    }
  }
  return out;
}

export async function embedQuery(text: string) {
  const [v] = await embedTexts([text], "RETRIEVAL_QUERY");
  return v;
}

export function toVectorLiteral(v: number[]) {
  return `[${v.map((x) => (Number.isFinite(x) ? x.toFixed(7) : "0")).join(",")}]`;
}
