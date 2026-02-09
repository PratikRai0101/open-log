import { NextResponse } from "next/server";
import { genAI, DEFAULT_MODEL, DEFAULT_CHUNK_SIZE } from "../../../lib/gemini";
import { groupCommitsByType, formatCommitLine, chunkArray } from "../../../lib/commitUtils";

// Resolve the model at runtime so developers can override with env or available models
const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

export async function POST(req: Request) {
  try {
    const { repo, commits } = await req.json();

    if (!commits || !Array.isArray(commits)) {
      return NextResponse.json({ error: "Invalid commits data" }, { status: 400 });
    }

    // Group commits semantically by type to let the model focus per-section.
    const groups = groupCommitsByType(commits as any[]);

    // Respect env override to send everything as one prompt when desired
    const disableChunking = (process.env.DISABLE_CHUNKING || "").toLowerCase() === "true";
    const chunkSize = disableChunking ? -1 : Number(process.env.COMMIT_CHUNK_SIZE) || DEFAULT_CHUNK_SIZE;

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
    // Build per-group chunk lists (array of arrays of lines). If chunkSize <= 0
    // we put the entire group's lines into a single chunk.
    const allChunks: string[][] = [];
    for (const [type, group] of Object.entries(groups)) {
      if (!group.length) continue;
      const lines = group.map((c) => formatCommitLine(c as any));
      if (chunkSize <= 0) {
        allChunks.push(lines);
      } else {
        const parts = chunkArray(lines, chunkSize);
        for (const p of parts) allChunks.push(p);
      }
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
