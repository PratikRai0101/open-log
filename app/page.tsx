import React from "react";
import { getUserRepos, Repo as GHRepo } from "../lib/github";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Terminal, Search, ArrowRight, Lock, Globe } from "lucide-react";

export default async function Dashboard() {
  const repos: GHRepo[] = await getUserRepos();

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-[#FF4F4F] selection:text-white relative overflow-hidden">
      <div className="fixed top-[-10%] left-[20%] w-[120vw] h-[500px] bg-red-500/10 blur-[120px] rotate-[-5deg] pointer-events-none" />
      <div className="fixed top-[30%] right-[-20%] w-[100vw] h-[400px] bg-indigo-500/10 blur-[120px] rotate-[5deg] pointer-events-none" />

      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/60 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 flex items-center justify-center text-[#FF4F4F] bg-white/5 rounded-lg border border-white/5 shadow-[0_0_15px_rgba(255,79,79,0.2)]">
              <Terminal size={18} />
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">ShipLog</span>
          </div>

          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-xs font-medium bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md border border-white/5 transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "size-8 ring-1 ring-white/10",
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/5 text-[11px] font-medium text-zinc-400 mb-6 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4F4F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF4F4F]"></span>
            </span>
            Real-time Sync Active
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tighter mb-4 pb-2">Command Center</h1>
        </div>

        <div className="mb-12 relative group max-w-xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center bg-[#0A0A0B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10 transition-all">
            <div className="pl-4 text-zinc-500">
              <Search size={20} />
            </div>
            <input type="text" placeholder="Search repositories..." className="w-full bg-transparent border-none py-4 pl-3 pr-4 text-zinc-200 placeholder-zinc-600 focus:ring-0 text-sm" />
            <div className="pr-4">
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-2 font-mono text-[10px] text-zinc-500">⌘K</kbd>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Your Repositories</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repos.length > 0 ? (
              repos.map((repo) => (
                <Link href={`/generate/${repo.full_name}`} key={repo.id}>
                  <div className="group relative p-5 h-36 flex flex-col justify-between bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-xl transition-all cursor-pointer overflow-hidden backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="text-zinc-500 group-hover:text-[#FF4F4F] transition-colors">
                            {repo.private ? <Lock size={18} /> : <Globe size={18} />}
                          </div>
                          <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate max-w-[140px]">{repo.name}</span>
                        </div>
                        {repo.language && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 border border-white/5">{repo.language}</span>
                        )}
                      </div>
                      <p className="text-[12px] text-zinc-500 line-clamp-1">{repo.description || "No description provided"}</p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2 text-[11px] text-zinc-600">
                        <span className={`size-1.5 rounded-full ${repo.private ? "bg-amber-500" : "bg-emerald-500"} shadow-[0_0_8px_currentColor]`} />
                        {formatDistanceToNow(new Date(repo.updated_at))} ago
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300 text-zinc-400">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 border border-dashed border-white/10 rounded-xl">
                <p className="text-zinc-500 text-sm">No repositories found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
