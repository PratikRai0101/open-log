"use client";

import React from "react";
import { Folder, Star } from "lucide-react";

type Repo = {
  id: string;
  name: string;
  desc: string;
  stars: number;
  branch: string;
};

export default function RepoCard({ repo }: { repo: Repo }) {
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
