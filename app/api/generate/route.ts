import { NextResponse } from "next/server";
// Temporarily disable Gemini server path: keep imports but comment out usage where practical.
import { genAI, DEFAULT_MODEL, DEFAULT_CHUNK_SIZE, listModels, resolveModel } from "../../../lib/gemini";
import { generateChangelog, AIModel } from "@/lib/ai";
import { groupCommitsByType, formatCommitLine, chunkArray } from "../../../lib/commitUtils";

// Note: genAI client does not expose getGenerativeModel; we use DEFAULT_MODEL directly

export async function POST(req: Request) {
  try {
    const { repo, commits, model } = await req.json();

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

    // Gem in i path: temporarily disabled. We default to Groq path unless the
    // explicit model is provided. If in future we re-enable Gemini, we can
    // restore the resolveModel logic above.
    const useGemini = false;
    let geminiModel = DEFAULT_MODEL;

    // Create a combined ReadableStream that sequentially streams each chunk's
    // generated text.
    // If client requested one of our explicit models (Groq/Moonshot), use the
    // lib/ai wrapper which talks to those providers. We return the full
    // generated markdown as a single response (non-streaming) to keep the
    // client experience consistent.
    const knownAIModels: (AIModel | 'gemma-27b-it')[] = ["llama-3.3-70b-versatile", "kimi-k2-turbo-preview", 'gemma-27b-it'];
    if (model && knownAIModels.includes(model as any) && model !== 'gemma-27b-it') {
      try {
        // Extract plain commit messages (input may be objects or strings)
        const messages: string[] = (commits || []).map((c: any) => {
          if (!c) return "";
          if (typeof c === "string") return c;
          return c.message || c.commit?.message || String(c);
        });

        const md = await generateChangelog(messages, model as AIModel, repo || "project");
        return new Response(md, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      } catch (err) {
        console.error("AI generateChangelog failed:", err);
        return NextResponse.json({ error: "Generation failed" }, { status: 500 });
      }
    }

    // If Gemini is disabled (no GOOGLE_API_KEY) or we've globally disabled the
    // Gemini path, fall back to the Groq/Moonshot path used elsewhere which
    // requires provider API keys. This prevents attempts to call the Google
    // Generative REST endpoint without credentials which returns 403.
    if (!process.env.GOOGLE_API_KEY || !useGemini) {
      try {
        const messages: string[] = (commits || []).map((c: any) => {
          if (!c) return "";
          if (typeof c === "string") return c;
          return c.message || c.commit?.message || String(c);
        });

        // Use the Groq-compatible path to generate a single changelog for the
        // entire commit set. This preserves UX while avoiding Gemini calls.
        const md = await generateChangelog(messages, "llama-3.3-70b-versatile", repo || "project");
        return new Response(md, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      } catch (err) {
        console.error("Fallback generation failed:", err);
        return NextResponse.json({ error: "Generation failed" }, { status: 500 });
      }
    }

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
            // Fallback: call the Google Generative REST endpoint per-chunk
            // (some SDK builds may not expose streaming on the returned model).
            const gkey = process.env.GOOGLE_API_KEY;
                const genEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateText`;

            controller.enqueue(new TextEncoder().encode("~~JSON~~" + JSON.stringify({ chunkIndex, chunkLines: chunkLines.length }) + "\n"));

            let currentChunkText = "";
            const streamByWord = model === 'gemma-27b-it';
            try {
              // Use the official Google GenAI client to generate content for Gemini
              // in a single request per chunk. This mirrors the quickstart pattern.
              let gRes;
                 try {
                 const genResp = await genAI.models.generateContent({
                   model: geminiModel,
                   contents: p,
                   // generation config fields may vary; we pass text only here
                 } as any);
                // genResp.text or genResp.output may contain the result
                const parsed = (genResp as any).text || (genResp as any).output?.[0]?.content?.map((c: any) => c.text || "").join("");
                if (parsed) {
                  currentChunkText = parsed;
                  // Stream per-word for gemma to avoid splitting multi-byte
                  // characters and to improve typing smoothness; otherwise stream per-character.
                  const encoder = new TextEncoder();
                  if (streamByWord) {
                    const parts = currentChunkText.split(/(\s+)/);
                    for (const part of parts) {
                      if (!part) continue;
                      controller.enqueue(encoder.encode(part));
                    }
                  } else {
                    for (let i = 0; i < currentChunkText.length; i++) {
                      controller.enqueue(encoder.encode(currentChunkText.charAt(i)));
                    }
                  }
                }
              } catch (err) {
                // Fallback to REST call if SDK fails
                gRes = await fetch(genEndpoint, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...(gkey ? { "x-goog-api-key": gkey } : {}),
                  },
                  body: JSON.stringify({
                    prompt: { text: p },
                    temperature: Number(process.env.GENERATION_TEMPERATURE) || 0.2,
                    maxOutputTokens: Number(process.env.GENERATION_MAX_TOKENS) || 1024,
                  }),
                });
              }

              if (gRes) {
                if (!gRes.ok) {
                  const errText = await gRes.text();
                  console.error("Google Generative API error:", errText);
                } else {
                  const j = await gRes.json();
                  // Try common response shapes
                  let text = "";
                  if (j.candidates && Array.isArray(j.candidates) && j.candidates[0]) {
                    if (typeof j.candidates[0].output === 'string') text = j.candidates[0].output;
                    else if (typeof j.candidates[0].content === 'string') text = j.candidates[0].content;
                    else if (Array.isArray(j.candidates[0].content)) text = j.candidates[0].content.map((c: any) => c.text || c).join('');
                  }
                  if (!text && typeof j.output === 'string') text = j.output;
                  if (!text && typeof j.text === 'string') text = j.text;
                    currentChunkText = text || "";
                    if (currentChunkText) {
                      const encoder = new TextEncoder();
                      if (streamByWord) {
                        const parts = currentChunkText.split(/(\s+)/);
                        for (const part of parts) {
                          if (!part) continue;
                          controller.enqueue(encoder.encode(part));
                        }
                      } else {
                        // Stream per-character for a smoother typing effect
                        for (let i = 0; i < currentChunkText.length; i++) {
                          controller.enqueue(encoder.encode(currentChunkText.charAt(i)));
                        }
                      }
                    }
                }
              }
            } catch (err) {
              console.error("Error calling Google Generative API:", err);
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
