import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure API key is present
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("Missing GOOGLE_API_KEY in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// We use 'gemini-1.5-flash' for fast, low-latency responses
export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
