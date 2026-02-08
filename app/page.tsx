"use client";

import Image from "next/image";
import React, { useState } from "react";
import { Search, Folder, Star } from "lucide-react";

type Repo = {
  id: string;
  name: string;
  desc: string;
  stars: number;
  branch: string;
};

const SAMPLE_REPOS: Repo[] = [
  { id: "1", name: "shiplog-web", desc: "AI-powered changelogs for your repos.", stars: 214, branch: "main" },
  { id: "2", name: "shiplog-cli", desc: "CLI for generating release notes.", stars: 86, branch: "stable" },
  { id: "3", name: "shiplog-embed", desc: "Embeddable release widgets.", stars: 43, branch: "canary" },
  { id: "4", name: "shiplog-proxy", desc: "Supabase sync and proxies.", stars: 19, branch: "main" },
  { id: "5", name: "shiplog-ui", desc: "Design system & components.", stars: 132, branch: "dev" },
  { id: "6", name: "shiplog-server", desc: "Serverless workers and hooks.", stars: 58, branch: "release" },
];

function SearchIsland({ query, setQuery }: { query: string; setQuery: (s: string) => void }) {
  return (
    <div className="search-island glass-card pointer-events-auto w-[min(760px,92vw)]">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-white/3 p-2">
          <Search size={18} />
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search repositories or commands — ⌘K"
          className="flex-1 bg-transparent outline-none text-white placeholder:text-white/60 px-2 py-2"
        />
        <div className="kbd-badge">⌘K</div>
      </div>
    </div>
  );
}

function RepoCard({ repo }: { repo: Repo }) {
  return (
    <div className="repo-card glass-card p-4 border border-solid border-transparent">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-white/4 flex items-center justify-center">
            <Folder size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{repo.name}</h3>
              <span className="text-xs text-white/60">• {repo.branch}</span>
            </div>
            <p className="text-xs text-white/60 mt-1">{repo.desc}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <div className="text-xs text-white/70 flex items-center gap-1">
              <Star size={14} />
              <span>{repo.stars}</span>
            </div>
            <button className="liquid-button text-xs" aria-label={`Generate for ${repo.name}`}>
              Generate
            </button>
          </div>
          <div className="text-xs text-white/50">Updated 2 days ago</div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");

  const visible = SAMPLE_REPOS.filter((r) => r.name.includes(query) || r.desc.includes(query));

  return (
    <div className="min-h-screen relative bg-bg-obsidian text-white">
      <div className="anamorphic-flare-1" aria-hidden />
      <div className="anamorphic-flare-2" aria-hidden />

      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[min(1200px,94%)] z-40 glass-card px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-linear-to-r from-[#FF4F4F] to-[#6E5BFF]" />
          <span className="text-sm font-semibold">ShipLog</span>
        </div>
        <nav className="hidden md:flex items-center gap-4 text-sm opacity-90">
          <a href="#" className="hover:underline">
            Dashboard
          </a>
          <a href="#" className="hover:underline">
            Generate
          </a>
        </nav>
        <div />
      </header>

      <main className="w-full max-w-300 mx-auto px-6 pt-36 pb-20">
        <div className="flex justify-center">
          <SearchIsland query={query} setQuery={setQuery} />
        </div>

        <section className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </section>
      </main>
    </div>
  );
}
