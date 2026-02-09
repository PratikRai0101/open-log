import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure API key is present
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("Missing GOOGLE_API_KEY in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// Use a model supported by the v1beta API. `text-bison-001` is broadly available
// and works well for concise text generation. If you have access to a Gemini
// model in your Google Cloud project, replace this value with the model name.
export const model = genAI.getGenerativeModel({ model: "text-bison-001" });
