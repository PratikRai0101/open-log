import OpenAI from "openai";

// 1. Initialize Groq (Fast)
if (!process.env.GROQ_API_KEY) {
  console.warn("GROQ_API_KEY not set — Groq generation will fail if requested");
}
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || undefined,
  baseURL: "https://api.groq.com/openai/v1",
});

// 2. Initialize Moonshot/Kimi (Smart & Big Context)
if (!process.env.MOONSHOT_API_KEY) {
  console.warn("MOONSHOT_API_KEY not set — Moonshot/Kimi generation will fail if requested");
}
const moonshot = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY || undefined,
  baseURL: "https://api.moonshot.cn/v1",
});

export type AIModel = "llama-3.3-70b-versatile" | "moonshot-v1-8k";

export async function generateChangelog(commits: string[], model: AIModel, projectName: string) {
  const prompt = `
    You are an expert technical writer. Convert these git commits for "${projectName}" into a professional Markdown changelog.
    
    Structure:
    ## 🚀 New Features
    ## 🐛 Bug Fixes
    ## 🛠️ Improvements
    
    Rules:
    - Ignore trivial commits (typos, merge master).
    - Use bullet points.
    - Be concise.
    
    Commits:
    ${commits.join("\n")}
  `;

    try {
      let response: any;

      if (model.includes("llama")) {
        if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY environment variable");
        // Groq/OpenAI-compatible SDK usage
        response = await groq.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: prompt }],
        });
      } else {
        if (!process.env.MOONSHOT_API_KEY) throw new Error("Missing MOONSHOT_API_KEY environment variable");
        response = await moonshot.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        });
      }

      // Normalize response shapes
      const content = response?.choices?.[0]?.message?.content || response?.choices?.[0]?.text || response?.data?.choices?.[0]?.message?.content;
      if (!content) {
        console.error("AI responded with unexpected shape:", { response });
        throw new Error("AI returned an unexpected response shape");
      }
      return content;
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      // Surface provider error message if available for easier debugging
      const msg = error?.message || String(error);
      throw new Error(`Failed to generate changelog: ${msg}`);
    }
}
