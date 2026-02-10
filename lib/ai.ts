import OpenAI from "openai";

// 1. Initialize Groq (Fast)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// 2. Initialize Moonshot/Kimi (Smart & Big Context)
const moonshot = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY,
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
      // Groq/OpenAI-compatible SDK usage
      response = await groq.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: prompt }],
      });
    } else {
      response = await moonshot.chat.completions.create({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });
    }

    return response.choices?.[0]?.message?.content || "No changelog generated.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Failed to generate changelog. Please try again.");
  }
}
