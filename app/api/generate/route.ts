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
    const commitList = commits
      .map((c: any) => `- [${c.hash.substring(0, 7)}] ${c.message} (${c.author_name})`)
      .join("\n");
    const prompt = `
You are an expert Release Manager. I will give you a list of raw git commits.
Your job is to rewrite them into a clean, professional Changelog (Markdown).
Rules:
1. Group commits into sections: "🚀 Features", "🐛 Bug Fixes", "⚡ Improvements", and "🔧 Chore".
2. Remove technical jargon if possible; make it readable for humans.
3. Combine similar commits into one summary line if they are redundant.
4. Keep the tone exciting but professional.
5. Do NOT include the commit hashes in the final output.

Raw Commits:
${commitList}
`;

    // Streaming generation: use the SDK streaming API and proxy chunks to the
    // client as a plain text stream. The client will append chunks as they
    // arrive to render partial output.
    const streamResult = await model.generateContentStream(prompt as any);

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            try {
              const text = (chunk as any).text();
              if (text) {
                // Queue UTF-8 chunk; add a separator so client can split if needed
                controller.enqueue(new TextEncoder().encode(text + "\n"));
              }
            } catch (e) {
              // If a chunk can't produce text, skip it
              console.error("Error extracting chunk text:", e);
            }
          }
          controller.close();
        } catch (err) {
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
