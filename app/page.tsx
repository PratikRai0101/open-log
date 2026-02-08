"use client";
import React, { useState } from "react";
import SearchIsland from "../components/SearchIsland";
import RepoCard from "../components/RepoCard";

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

export default function Home() {
  const [query, setQuery] = useState("");

  const visible = SAMPLE_REPOS.filter((r) => r.name.includes(query) || r.desc.includes(query));

  return (
    <div className="min-h-screen relative bg-bg-obsidian text-white">
      {/* header and background flares are now provided globally in app/layout.tsx */}

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
