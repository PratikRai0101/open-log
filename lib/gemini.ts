import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure API key is present
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("Missing GOOGLE_API_KEY in environment variables");
}

export const genAI = new GoogleGenerativeAI(apiKey || "");

// Helper: List models directly from the REST endpoint to pick a supported one.
export async function listModels() {
  if (!apiKey) return [];
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": apiKey },
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Expect { models: [ { name: 'models/xyz', ... } ] }
    return Array.isArray(data.models) ? data.models.map((m: any) => m.name || m) : [];
  } catch (err) {
    console.error("Failed to list models:", err);
    return [];
  }
}

// Default model if nothing else is provided via env
export const DEFAULT_MODEL = process.env.GEMINI_MODEL || process.env.GOOGLE_MODEL || "gemini-2.5";

// Default commit chunk size to avoid hitting token limits. Can be overridden
// via COMMIT_CHUNK_SIZE env var.
export const DEFAULT_CHUNK_SIZE = Number(process.env.COMMIT_CHUNK_SIZE) || 20;

// Generation defaults (can be tuned via env)
export const DEFAULT_TEMPERATURE = Number(process.env.GENERATION_TEMPERATURE) || 0.2;
export const DEFAULT_MAX_OUTPUT_TOKENS = Number(process.env.GENERATION_MAX_TOKENS) || 1024;
