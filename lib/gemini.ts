// Minimal Gemini/Generative API client adapter
// Uses the Google Generative Language REST API via API key.
// Exports a single `generateChangelog` function that accepts commits and returns a string.

export type SimpleCommit = {
  hash: string;
  message: string;
  author?: string | null;
  date?: string | null;
};

export async function generateChangelog(repo: string, commits: SimpleCommit[]) {
  const apiKey = process.env.GENERATIVE_API_KEY || process.env.GOOGLE_API_KEY;
  const model = process.env.GEMINI_MODEL || "text-bison-001";

  if (!apiKey) {
    throw new Error("Missing GENERATIVE_API_KEY or GOOGLE_API_KEY env var for Gemini API");
  }

  const prompt = `You are an automated changelog generator. Given the following commits for repo ${repo}, produce a concise changelog grouped into sections: Features, Bug Fixes, Chores, Refactors. For each bullet include the commit message and author (if available). Keep bullets short and use Markdown.

Commits:\n${commits
    .map((c) => `- ${c.hash} | ${c.author ?? "unknown"} | ${c.message.replace(/\n/g, " ")}`)
    .join("\n")}

Output:`;

  const url = `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generateText?key=${apiKey}`;

  const body = {
    prompt: { text: prompt },
    // Lower temperature for more deterministic/changelog-y output
    temperature: 0.15,
    maxOutputTokens: 512,
  } as any;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${txt}`);
  }

  const json = await res.json();
  // Response shape: { candidates: [{ output }], ... } or { result: { candidates: [...] } }
  // Try to find a sensible text field in known response shapes.
  let output: string | undefined;
  if (json.candidates && json.candidates[0]?.output) output = json.candidates[0].output;
  if (!output && json.candidates && json.candidates[0]?.content) output = json.candidates[0].content;
  if (!output && json.result?.candidates && json.result.candidates[0]?.output) output = json.result.candidates[0].output;
  if (!output && typeof json?.output === "string") output = json.output;

  if (!output) {
    // Fallback: stringify the whole response
    output = JSON.stringify(json, null, 2);
  }

  return output as string;
}
