// Small utilities to group and chunk commits for semantic prompting
export type RawCommit = { hash?: string; message: string; date?: string; author_name?: string; type?: string };

export const KNOWN_TYPES = ["feat", "fix", "perf", "docs", "style", "refactor", "test", "chore", "misc"] as const;

export function normalizeType(t?: string) {
  if (!t) return "misc";
  const lower = t.toLowerCase();
  return KNOWN_TYPES.includes(lower as any) ? lower : "misc";
}

export function groupCommitsByType(commits: RawCommit[]) {
  const groups: Record<string, RawCommit[]> = {};
  for (const k of KNOWN_TYPES) groups[k] = [];
  for (const c of commits) {
    const t = normalizeType(c.type || extractTypeFromMessage(c.message));
    if (!groups[t]) groups[t] = [];
    groups[t].push(c);
  }
  return groups;
}

export function extractTypeFromMessage(msg: string) {
  // Look for conventional commit style prefix like "feat(scope): message" or "fix: msg"
  const m = msg.match(/^\s*([a-zA-Z]+)(?:\(|:)/);
  if (m && m[1]) return m[1].toLowerCase();
  return "misc";
}

export function formatCommitLine(c: RawCommit) {
  const type = c.type ? `${c.type.toLowerCase()}: ` : "";
  return `- ${type}${c.message} — ${c.author_name || "unknown"}`;
}

export function chunkArray<T>(arr: T[], size: number) {
  if (size <= 0) return [arr.slice()];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
