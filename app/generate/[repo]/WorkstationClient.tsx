"use client";

import React, { useEffect, useState } from "react";
import { Check, ArrowRight, GitCommit } from "lucide-react";
import { getCommits, SimpleCommit } from "../../../lib/github";

type Commit = {
  id: string;
  type: "feat" | "fix" | "chore" | "refactor";
  title: string;
  desc?: string;
  author?: string;
  ts?: string;
};

const MOCK_COMMITS: Commit[] = [
  {
    id: "c1",
    type: "feat",
    title: "Add AI changelog endpoint",
    desc: "Expose /api/generate to create changelogs via Gemini",
    author: "alice",
    ts: "3h",
  },
  { id: "c2", type: "fix", title: "Normalize timestamps", desc: "Fix timezone edge-cases in webhook listener", author: "bob", ts: "6h" },
  { id: "c3", type: "chore", title: "Bump supabase client", desc: "Upgrade to latest for performance fixes", author: "carol", ts: "1d" },
  { id: "c4", type: "refactor", title: "Extract publish queue", desc: "Move publish logic into background worker", author: "dan", ts: "2d" },
  { id: "c5", type: "feat", title: "Embed widget", desc: "Add embeddable release cards for docs", author: "eve", ts: "3d" },
  { id: "c6", type: "fix", title: "Handle null PR titles", desc: "Prevent crash when PR title missing", author: "frank", ts: "4d" },
];

export default function WorkstationClient({ repo }: { repo?: string }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [commits, setCommits] = useState<SimpleCommit[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!repo) return;
      setLoading(true);
      try {
        const c = await getCommits(repo);
        if (mounted) setCommits(c.slice(0, 50));
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [repo]);

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function publish() {
    const chosen = Object.keys(selected).filter((k) => selected[k]);
    // placeholder: integrate server action later
    alert(`Publishing ${chosen.length} commits:\n${chosen.join(", ")}`);
  }

  return (
    <div className="h-screen flex overflow-hidden bg-bg-midnight text-white">
      {/* Left Sidebar */}
        <aside className="w-[380px] shrink-0 h-full bg-[#050505]/60 backdrop-blur-xl border-r border-[rgba(255,255,255,0.04)] overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[#FF4F4F] to-[#6E5BFF]" />
            <div>
              <div className="text-sm font-semibold">{repo ?? "shiplog/mono-repo"}</div>
              <div className="text-xs text-white/60">main · {MOCK_COMMITS.length} commits</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {loading && <div className="text-xs text-white/60">Loading commits...</div>}
          {!loading && commits && commits.length === 0 && (
            <div className="text-xs text-white/60">No commits found.</div>
          )}

          {!loading && commits && commits.map((c) => {
            const checked = !!selected[c.hash];
            return (
              <div
                key={c.hash}
                onClick={() => toggle(c.hash)}
                role="button"
                tabIndex={0}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer select-none transition-shadow ${
                  checked ? "bg-[linear-gradient(90deg,rgba(255,79,79,0.10),transparent)]" : "hover:bg-white/2"
                }`}
              >
                {/* Neon Checkbox */}
                <div className={`custom-check ${checked ? "checked" : ""}`} aria-hidden>
                  {checked ? <Check size={12} className="text-white" /> : <div style={{ width: 10, height: 10 }} />} 
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-white/3 text-white/90">
                      commit
                    </span>
                    <div className="text-sm font-medium truncate">{c.message.split('\n')[0]}</div>
                  </div>
                  <div className="text-xs text-white/50 mt-1 truncate">{c.message}</div>
                </div>

                <div className="flex flex-col items-end text-xs text-white/50">
                  <div className="flex items-center gap-2">
                    <GitCommit size={14} />
                    <span>{c.author ?? "unknown"}</span>
                  </div>
                  <div className="mt-1">{new Date(c.date).toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Right Panel */}
      <section className="flex-1 relative h-full flex flex-col">
        {/* Background Streaks (moved to globals.css where possible) */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="bg-streak-1" />
          <div className="bg-streak-2" />
        </div>

        {/* Top bar */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold">Compose Release</div>
            <div className="text-xs text-white/60">Preview</div>
          </div>

          <div className="flex items-center gap-3">
            <button className="liquid-button publish-btn px-4 py-2 text-sm" onClick={publish}>
              Publish
            </button>
            <button className="flex items-center gap-2 text-xs text-white/60 hover:text-white">
              <ArrowRight size={14} /> Deploy
            </button>
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.03)] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 px-3 rounded bg-white/3 flex items-center text-xs">SUMMARY</div>
                  <div className="text-sm text-white/70">Changelog Preview</div>
                </div>
                <div className="text-xs text-white/50">Preview mode</div>
              </div>

              <div className="font-mono text-sm leading-6 text-[rgba(255,255,255,0.95)] bg-transparent min-h-[360px] p-4 rounded">
                <div className="mb-3">
                  <div className="text-[13px] text-[#7FFFD4]"># Features</div>
                  <div className="pl-4">
                    <div>- Add AI-generated changelog endpoint <span className="text-xs text-white/60">(@alice)</span></div>
                    <div>- Embed widget for docs <span className="text-xs text-white/60">(@eve)</span></div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="text-[13px] text-[#FFB86B]"># Bug Fixes</div>
                  <div className="pl-4">
                    <div>- Normalize commit timestamps <span className="text-xs text-white/60">(@bob)</span></div>
                    <div>- Handle null PR titles <span className="text-xs text-white/60">(@frank)</span></div>
                  </div>
                </div>

                <div className="relative mt-6">
                  <div className="text-xs text-white/50">Draft note</div>
                  <pre className="mt-2 bg-[rgba(255,255,255,0.01)] rounded p-3 text-[13px] overflow-auto">{`- AI changelogs improve dev velocity
 - Keep release notes concise and actionable
 - Add links to PRs and docs`}</pre>

                  {/* Typewriter cursor */}
                  <div className="mt-2">
                    <span className="typewriter-cursor inline-block align-bottom w-2 h-4" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-white/60">Selected commits: {Object.values(selected).filter(Boolean).length}</div>
                  <div className="flex items-center gap-3">
                    <button className="liquid-button publish-btn px-3 py-1 text-xs" onClick={publish}>
                      Publish
                    </button>
                    <button className="text-xs text-white/60 hover:text-white">Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* local component styles remaining in css modules cause hydration issues; moved streaks to globals.css and kept small local styles as classes in globals when possible */}
    </div>
  );
}
