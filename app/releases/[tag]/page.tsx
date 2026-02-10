import React from "react";
import { Calendar, User, ArrowLeft, Copy } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

// Mock Data (Replace with real DB fetch later)
const RELEASE = {
  version: "v2.4.0",
  date: "Jan 24, 2024",
  author: "OpenLog AI",
  content: `
## 🚀 New Features

### Redis Caching Layer

Implemented a robust caching strategy for API endpoints. This significantly reduces database load and improves response times by up to **400ms**.

### Dark Mode Toggle

Added a user-facing toggle for dark mode preference. The state is now persisted across sessions using local storage context providers.

## 🐛 Bug Fixes

### Session Timeout

Resolved a critical race condition where authentication tokens failed to refresh on high-latency mobile networks.
`
};

export default function ReleasePage({ params }: { params: { tag: string } }) {
  return (
    <div className="min-h-screen p-8 bg-[#050505] text-zinc-300">
      <div className="max-w-7xl mx-auto">
        {/* Back Link */}
        <div className="w-full max-w-3xl mb-8 relative z-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>

        <div className="w-full max-w-3xl bg-[#0A0A0B] border border-white/10 rounded-2xl shadow-2xl relative z-10 overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white tracking-tight">Release Notes</h1>
                <span className="text-3xl font-bold text-[#FF4F4F]">{RELEASE.version}</span>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-400 transition-colors border border-white/5">
                <Copy size={14} /> Copy
              </button>
            </div>

            <div className="flex items-center gap-6 text-sm text-zinc-500 font-mono">
              <span className="flex items-center gap-2"><Calendar size={14} /> {RELEASE.date}</span>
              <span className="flex items-center gap-2"><User size={14} /> {RELEASE.author}</span>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-10 prose prose-invert max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-400 prose-li:text-zinc-300">
            <ReactMarkdown>{RELEASE.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
