import { NextResponse } from "next/server";
import { model } from "../../../lib/gemini";

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

    // Generate content
    // The SDK accepts a string or Parts array for contents — pass the prompt string.
    const result = await model.generateContent(prompt as any);
    // result.response is the enhanced response with helper methods (text)
    const { response } = result as any;
    const text = response.text();

    return NextResponse.json({ changelog: text });
  } catch (error) {
    console.error("AI Generation Failed:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
