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

    // Enforce bold titles and strict bullet format in the model prompt
    // (clarity: the model should output bullets like: **Title**: Description)
    // We append a short instruction to the prompt to bias format.
    const formatEnforcer = `\n\nFormat every bullet point exactly like this: **Title of Change**: Description of change. Do not use sub-bullets. Keep it clean.`;

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
        // Dynamic chunking: if enabled, cap per-chunk lines to a safe max
        const dynamic = ((process.env.DYNAMIC_CHUNKING || "true").toLowerCase() === "true");
        const maxChunkLines = Number(process.env.MAX_CHUNK_LINES) || 40;
        const effectiveChunkSize = dynamic ? Math.min(chunkSize, maxChunkLines) : chunkSize;
        const parts = chunkArray(lines, effectiveChunkSize);
        for (const p of parts) allChunks.push(p);
      }
    }

    // Helper: post-process merged chunk outputs to dedupe bullets per section
    function postProcessMerge(text: string) {
      // Split into sections by heading lines (## ...)
      const lines = text.split(/\r?\n/);
      const sections: Record<string, string[]> = {};
      let current = "__intro__";
      sections[current] = [];
      for (const l of lines) {
        const m = l.match(/^##\s*(.*)/);
        if (m) {
          current = m[1].trim() || "__misc__";
          if (!sections[current]) sections[current] = [];
        } else {
          if (l.trim()) sections[current].push(l);
        }
      }
      // Dedupe bullets inside each section
      const orderedKeys = Object.keys(sections);
      const outSections: string[] = [];
      for (const key of orderedKeys) {
        const items = sections[key];
        if (!items.length) continue;
        // If this is an intro (no heading), keep as-is
        if (key === "__intro__") {
          outSections.push(items.join("\n"));
          continue;
        }
        // Deduplicate lines
        const seen = new Set<string>();
        const filtered = [] as string[];
        // Clean up list markers inside each line to avoid double-bullets
        for (const it of items) {
          let trimmed = it.trim();
          if (!trimmed) continue;

          // Replace runs of mixed bullet-like chars at the start with a single '- '
          // Covers: • ◦ ° ○ * - and combinations like '- •' or '• -'
          // then normalize multiple leading dashes to a single '- '
          trimmed = trimmed.replace(/^([\-\*]\s*)?[\u2022\u25E6\u00B0\u25E6\u2023\u2024\u2219\u00B7\u25CB\u25CF\s\-\*]+/, '- ');

          if (!trimmed) continue;
          if (seen.has(trimmed)) continue;
          seen.add(trimmed);
          filtered.push(trimmed);
        }
        if (filtered.length === 0) continue;
        outSections.push(`## ${key}`);
        outSections.push(...filtered);
      }
      return outSections.join("\n\n");
    }

    // Create a combined ReadableStream that sequentially streams each chunk's
    // generated text.
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send a small meta header so the client can estimate progress.
          const totalChunks = allChunks.length;
          controller.enqueue(new TextEncoder().encode("~~JSON~~" + JSON.stringify({ meta: { totalCommits: commits.length, totalChunks } }) + "\n"));
          const chunkOutputs: string[] = [];
          for (const [chunkIndex, chunkLines] of allChunks.entries()) {
            const p = basePrompt(chunkLines) + formatEnforcer;
            // Pass generationConfig (part of the request params) with temperature and max tokens
            // Pass the prompt as a string (the SDK accepts string or array of parts)
            // and pass generationConfig as the second argument (requestOptions).
            const streamResult = await model.generateContentStream(p, {
              generationConfig: {
                temperature: Number(process.env.GENERATION_TEMPERATURE) || 0.2,
                maxOutputTokens: Number(process.env.GENERATION_MAX_TOKENS) || 1024,
              },
            } as any);

            // Announce upcoming chunk to client
            controller.enqueue(new TextEncoder().encode("~~JSON~~" + JSON.stringify({ chunkIndex, chunkLines: chunkLines.length }) + "\n"));

            // Collect chunk output while streaming it to client
            let currentChunkText = "";
            for await (const part of streamResult.stream) {
              try {
                const text = (part as any).text();
                if (text) {
                  currentChunkText += text;
                  controller.enqueue(new TextEncoder().encode(text));
                }
              } catch (e) {
                console.error("chunk parse error:", e);
              }
            }

            // push collected chunk output for post-processing
            chunkOutputs.push(currentChunkText);

            // Notify client that this chunk finished
            controller.enqueue(new TextEncoder().encode("~~JSON~~" + JSON.stringify({ chunkDone: chunkIndex }) + "\n"));
            // Small separator between chunk outputs
            controller.enqueue(new TextEncoder().encode("\n\n"));
          }

          // After all chunks complete, post-process merged output to dedupe and tidy sections
          try {
            const merged = postProcessMerge(chunkOutputs.join("\n\n"));
            // Send final marker then the merged content so client can replace prior content
            controller.enqueue(new TextEncoder().encode("~~JSON~~" + JSON.stringify({ final: true }) + "\n"));
            controller.enqueue(new TextEncoder().encode(merged));
          } catch (e) {
            console.error("Post-process merge failed:", e);
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
