"use client";

import { Search } from "lucide-react";
import React from "react";

export default function SearchIsland({ query, setQuery }: { query: string; setQuery: (s: string) => void }) {
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
