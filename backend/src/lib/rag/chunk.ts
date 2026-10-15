export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 150;

export function normalizeText(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitIntoUnits(text: string): string[] {
  const units: string[] = [];
  for (const para of text.split(/\n\s*\n/)) {
    const p = para.trim();
    if (!p) continue;
    if (p.length <= CHUNK_SIZE) {
      units.push(p);
      continue;
    }
    for (const sentence of p.split(/(?<=[.!?])\s+/)) {
      if (sentence.length <= CHUNK_SIZE) units.push(sentence);
      else
        for (let i = 0; i < sentence.length; i += CHUNK_SIZE - CHUNK_OVERLAP)
          units.push(sentence.slice(i, i + CHUNK_SIZE));
    }
  }
  return units;
}

export function chunkText(raw: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const text = normalizeText(raw);
  if (!text) return [];
  if (text.length <= size) return [text];

  const chunks: string[] = [];
  let current = "";
  for (const unit of splitIntoUnits(text)) {
    const candidate = current ? `${current}\n\n${unit}` : unit;
    if (candidate.length <= size) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current);
    const tail = current.slice(-overlap);
    const cut = tail.indexOf(" ");
    const overlapText = cut >= 0 ? tail.slice(cut + 1) : tail;
    current =
      overlapText && overlapText.length + unit.length + 2 <= size ? `${overlapText}\n\n${unit}` : unit;
  }
  if (current) chunks.push(current);
  return chunks;
}
