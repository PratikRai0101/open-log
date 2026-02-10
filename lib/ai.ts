import OpenAI from "openai";

// NOTE: Do not instantiate OpenAI clients at module load time because the
// library throws when no API key is present. We lazily construct a client
// inside `generateChangelog` so builds work when provider keys are absent.

export type AIModel = "llama-3.3-70b-versatile" | "kimi-k2-turbo-preview";

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
        const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
        // Groq/OpenAI-compatible SDK usage
        response = await groq.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: prompt }],
        });
      } else {
        if (!process.env.MOONSHOT_API_KEY) throw new Error("Missing MOONSHOT_API_KEY environment variable");
        const moonshot = new OpenAI({ apiKey: process.env.MOONSHOT_API_KEY, baseURL: "https://api.moonshot.ai/v1" });
        // Use the Moonshot/OpenAI-compatible client to create a chat completion.
        // Include a short system prompt that identifies the assistant as Kimi
        // per Moonshot's quickstart example.
        const messages = [
          {
            role: "system",
            content:
              "You are Kimi, an AI assistant provided by Moonshot AI. You are proficient in Chinese and English conversations. Provide safe, helpful, and accurate answers. Reject requests involving terrorism, racism, or explicit content.",
          },
          { role: "user", content: prompt },
        ];

        response = await moonshot.chat.completions.create({
          model: model,
          messages,
          temperature: 0.3,
        } as any);
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
