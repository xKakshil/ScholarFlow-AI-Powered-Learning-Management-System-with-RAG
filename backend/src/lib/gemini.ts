import { GoogleGenAI } from "@google/genai";

export const GEMINI_CHAT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

export const isGemini3 = (model: string) => !/^gemini-(1|2)\./.test(model);
export const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

// Must match vector(768) in prisma/schema.prisma.
export const EMBEDDING_DIMENSIONS = 768;

let client: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new GeminiConfigError("GEMINI_API_KEY is not set.");
  }
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export class GeminiConfigError extends Error {}

export function isRateLimitError(error: unknown) {
  const message = String((error as { message?: string })?.message ?? error).toLowerCase();
  const status = (error as { status?: number })?.status;
  return (
    status === 429 ||
    message.includes("429") ||
    message.includes("quota") ||
    message.includes("resource_exhausted")
  );
}
