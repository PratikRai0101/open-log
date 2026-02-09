import { NextResponse } from "next/server";
import { genAI, DEFAULT_MODEL } from "../../../lib/gemini";

// Resolve the model at runtime so developers can override with env or available models
const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

export async function POST(req: Request) {
  try {
    const { repo, commits } = await req.json();

    if (!commits || !Array.isArray(commits)) {
      return NextResponse.json({ error: "Invalid commits data" }, { status: 400 });
    }

    // Construct the prompt
    // Prepare commit list lines (include a type hint if present in the object)
    const lines = commits.map((c: any) => {
      const type = c.type ? `${c.type.toLowerCase()}: ` : "";
      return `- ${type}${c.message} — ${c.author_name || "unknown"}`;
    });

    // Chunk commits to avoid token limits; we'll summarize each chunk and
    // then concatenate results.
    const { DEFAULT_CHUNK_SIZE } = await import("../../../lib/gemini");
    const chunkSize = Number(process.env.COMMIT_CHUNK_SIZE) || DEFAULT_CHUNK_SIZE;

    // Build a strong prompt template with examples and clear rules.
    const basePrompt = (chunkLines: string[]) => `
You are an expert technical writer tasked with creating a short, user-friendly
Markdown changelog from raw git commit messages. Follow these rules exactly:

1) Output must be valid Markdown.
2) Group items into the following sections when relevant: "🚀 Features",
   "🐛 Bug Fixes", "⚡ Improvements", "🔧 Chore".
3) Do not include commit hashes or long diffs — keep entries as 1-2 concise
   sentences per grouped item.
4) If multiple commits are similar, combine them into one bullet.
5) Remove internal-only technical jargon; make language readable by non-devs.

Example Input:
- feat: add user auth flow — alice
- fix: correct token refresh bug — bob

Example Output:
## 🚀 Features
- Add user authentication flow (alice)

## 🐛 Bug Fixes
- Fix token refresh in background sync (bob)

Now process the raw commits below and return only the Markdown changelog.

Raw commits:
${chunkLines.join("\n")}
`;

    // For larger commit sets, chunk the commits and generate summaries for
    // each chunk, then stream the concatenated output back to the client.
    const allChunks: string[][] = [];
    for (let i = 0; i < lines.length; i += chunkSize) {
      allChunks.push(lines.slice(i, i + chunkSize));
    }

    // Create a combined ReadableStream that sequentially streams each chunk's
    // generated text.
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for (const chunkLines of allChunks) {
            const p = basePrompt(chunkLines);
            // Pass generationConfig (part of the request params) with temperature and max tokens
            // Pass the prompt as a string (the SDK accepts string or array of parts)
            // and pass generationConfig as the second argument (requestOptions).
            const streamResult = await model.generateContentStream(p, {
              generationConfig: {
                temperature: Number(process.env.GENERATION_TEMPERATURE) || 0.2,
                maxOutputTokens: Number(process.env.GENERATION_MAX_TOKENS) || 1024,
              },
            } as any);
            for await (const part of streamResult.stream) {
              try {
                const text = (part as any).text();
                if (text) controller.enqueue(new TextEncoder().encode(text));
              } catch (e) {
                console.error("chunk parse error:", e);
              }
            }
            // Small separator between chunk outputs
            controller.enqueue(new TextEncoder().encode("\n\n"));
          }
          controller.close();
        } catch (err) {
          console.error("Streaming generation error:", err);
          controller.error(err as Error);
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("AI Generation Failed:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
