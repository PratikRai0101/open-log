"use client";

import React, { useState } from "react";
import { Check, ArrowRight, GitCommit } from "lucide-react";

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
          {MOCK_COMMITS.map((c) => {
            const checked = !!selected[c.id];
            return (
              <div
                key={c.id}
                onClick={() => toggle(c.id)}
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
                      {c.type}
                    </span>
                    <div className="text-sm font-medium truncate">{c.title}</div>
                  </div>
                  <div className="text-xs text-white/50 mt-1 truncate">{c.desc}</div>
                </div>

                <div className="flex flex-col items-end text-xs text-white/50">
                  <div className="flex items-center gap-2">
                    <GitCommit size={14} />
                    <span>{c.author}</span>
                  </div>
                  <div className="mt-1">{c.ts}</div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Right Panel */}
      <section className="flex-1 relative h-full flex flex-col">
        {/* Background Streaks */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="streak streak-1" />
          <div className="streak streak-2" />
          <div className="streak streak-3" />
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

      <style jsx>{`
        .streak {
          position: absolute;
          filter: blur(36px) saturate(150%);
          opacity: 0.9;
          mix-blend-mode: screen;
          pointer-events: none;
          transform: scaleX(1.8);
          border-radius: 50%;
        }
        .streak-1 {
          width: 900px;
          height: 420px;
          left: -12%;
          top: 6%;
          background: radial-gradient(closest-side, rgba(255,79,79,0.28), transparent 35%);
          animation: streak-move-1 48s linear infinite;
        }
        .streak-2 {
          width: 700px;
          height: 340px;
          right: -8%;
          top: 20%;
          background: radial-gradient(closest-side, rgba(255,79,79,0.16), transparent 35%);
          animation: streak-move-2 60s linear infinite reverse;
        }
        .streak-3 {
          width: 500px;
          height: 260px;
          left: 20%;
          bottom: -6%;
          background: radial-gradient(closest-side, rgba(255,79,79,0.12), transparent 35%);
          animation: streak-move-3 72s linear infinite;
        }

        @keyframes streak-move-1 {
          0% { transform: translateX(0) scaleX(1.8) rotate(0deg); }
          50% { transform: translateX(6%) scaleX(1.9) rotate(20deg); }
          100% { transform: translateX(0) scaleX(1.8) rotate(0deg); }
        }
        @keyframes streak-move-2 {
          0% { transform: translateX(0) scaleX(1.6) rotate(0deg); }
          50% { transform: translateX(-6%) scaleX(1.7) rotate(-18deg); }
          100% { transform: translateX(0) scaleX(1.6) rotate(0deg); }
        }
        @keyframes streak-move-3 {
          0% { transform: translateY(0) scaleX(1.4) rotate(0deg); }
          50% { transform: translateY(-4%) scaleX(1.5) rotate(12deg); }
          100% { transform: translateY(0) scaleX(1.4) rotate(0deg); }
        }

        /* Neon checkbox */
        .custom-check {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.01);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: box-shadow .12s ease, background .12s ease, border-color .12s ease;
        }
        .custom-check.checked {
          box-shadow: 0 0 10px rgba(255,79,79,0.95), inset 0 0 8px rgba(255,79,79,0.06);
          border-color: rgba(255,79,79,0.3);
          background: linear-gradient(180deg, rgba(255,79,79,0.12), rgba(255,79,79,0.05));
        }

        /* Typewriter cursor */
        .typewriter-cursor {
          display: inline-block;
          width: 10px;
          height: 18px;
          background: #FF4F4F;
          animation: type-blink 1s steps(1) infinite;
          border-radius: 2px;
        }
        @keyframes type-blink {
          0%, 49% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Publish button - anamorphic shine */
        .publish-btn {
          position: relative;
          overflow: hidden;
        }
        .publish-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-120%) skewX(-12deg);
          background: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.08), rgba(255,255,255,0.02));
          z-index: 0;
          pointer-events: none;
          mix-blend-mode: overlay;
          animation: anamorphic-shine 2.8s linear infinite;
        }
        .publish-btn > * { position: relative; z-index: 1; }

        @keyframes anamorphic-shine {
          0% { transform: translateX(-120%) skewX(-12deg); }
          50% { transform: translateX(120%) skewX(-12deg); }
          100% { transform: translateX(240%) skewX(-12deg); }
        }
      `}</style>
    </div>
  );
}
