import Link from "next/link";
import {
  ArrowRight,
  Github,
  Sparkles,
  GitCommit,
  PenTool,
  Database,
  Edit3,
  Zap,
  Code,
  GitPullRequest,
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-[#FF4F4F] selection:text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#000000]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold">OL</div>
            <span className="text-white font-semibold tracking-tight">OpenLog</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/PratikRai0101/open-log" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300">
              <Github size={14} /> Star on GitHub
            </a>
            <Link href="/sign-in" className="text-sm font-medium text-zinc-200 px-3 py-1 rounded-md">Log in</Link>
          </div>
        </div>
      </header>

      <main className="pt-24">
        {/* HERO */}
        <section className="relative px-6 pt-12 pb-24">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/3 border border-white/10 text-xs text-zinc-400 font-medium mb-6">
              <Sparkles size={14} className="text-[#FF4F4F]" />
              <span>New: V2 engine — faster, smarter</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white leading-tight max-w-5xl mx-auto">
              Stop writing manual
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white/95 to-white/60">release notes.</span>
            </h1>

            <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
              Connect your GitHub, select commits, and let AI generate beautifully formatted changelogs in seconds. Open-source and built for power users.
            </p>

            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/generate" className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#FF4F4F] hover:bg-[#FF4F4F]/90 text-white font-semibold shadow-sm transition">Start Generating (Free) <ArrowRight size={16} /></Link>
              <a href="https://github.com/PratikRai0101/open-log" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 text-white/90 font-medium">View GitHub Repo</a>
            </div>

            {/* Product shot: left = commit list, right = release notes, center indicator */}
            <div className="mt-14">
              <div className="relative mx-auto max-w-6xl w-full rounded-2xl border border-white/6 bg-gradient-to-b from-black/40 to-transparent p-6 backdrop-blur-md shadow-2xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: faux commit list */}
                  <div className="rounded-xl border border-white/5 p-6 bg-[#050505]">
                    <div className="flex items-center gap-2 mb-4 text-xs font-mono text-zinc-500">
                      <span className="px-2 py-1 rounded bg-white/3">git_log --pretty=oneline</span>
                      <span className="ml-auto text-zinc-400">master</span>
                    </div>
                    <div className="space-y-2 text-sm font-mono text-zinc-400">
                      <div className="flex items-start gap-3">
                        <div className="w-8 text-xs text-rose-400">a7f23c1</div>
                        <div className="flex-1">feat: fixed the bug in the auth hook and some minor stuff</div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 text-xs text-emerald-400">b1e9a2b</div>
                        <div className="flex-1">chore: update docs for readme and contrib</div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 text-xs text-zinc-500">2c8b1a9</div>
                        <div className="flex-1">fix: small css tweak in navigation bar dropdown</div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 text-xs text-zinc-500">8c5a1f</div>
                        <div className="flex-1">refactor: clean up logic in session middleware</div>
                      </div>
                    </div>
                  </div>

                  {/* Right: release notes preview */}
                  <div className="rounded-xl border border-white/5 p-6 bg-[#050505] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-sm text-zinc-400">v2.4.0 Release Notes</div>
                          <h3 className="text-xl font-bold text-white mt-1">Security enhancements & refined UX</h3>
                        </div>
                        <div className="text-xs px-3 py-1 rounded-full bg-rose-600 text-white">Stable</div>
                      </div>
                      <ul className="space-y-3 text-sm text-zinc-400">
                        <li>Hardened the AuthHook architecture to prevent race conditions during session hydration.</li>
                        <li>Visual optimization of global navigation components and improved dropdown accessibility.</li>
                        <li>Migration of core build pipeline to Vite 5 for faster cold starts.</li>
                      </ul>
                    </div>
                    <div className="mt-6 text-xs text-zinc-500">Released • 2 days ago</div>
                  </div>
                </div>

                {/* Center lightning indicator */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-rose-500/40 to-rose-600/30 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-xl">
                    <div className="w-12 h-12 rounded-full bg-black/50 border border-rose-400/30 flex items-center justify-center">
                      <Zap className="text-rose-400" size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-[#050505] border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-white/3 border border-white/10 flex items-center justify-center mb-4">
                  <Database size={20} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Multi-Model AI</h3>
                <p className="text-zinc-400 text-sm mb-4">Leverage Gemini, Groq, or Moonshot to parse your history with surgical clarity.</p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded bg-white/3 text-xs">GEMINI</span>
                  <span className="px-2 py-1 rounded bg-white/3 text-xs">GROQ</span>
                  <span className="px-2 py-1 rounded bg-white/3 text-xs">MOONSHOT</span>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-[#050505] border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-white/3 border border-white/10 flex items-center justify-center mb-4">
                  <Edit3 size={20} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Notion-Style Editor</h3>
                <p className="text-zinc-400 text-sm mb-4">Refine release notes with a block-based editor that feels like native Notion or BlockNote.</p>
                <div className="text-xs text-zinc-500">BlockNote • Inline edits • Live preview</div>
              </div>

              <div className="p-8 rounded-2xl bg-[#050505] border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-white/3 border border-white/10 flex items-center justify-center mb-4">
                  <Zap size={20} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">One-Click Publish</h3>
                <p className="text-zinc-400 text-sm mb-4">Publish changelogs directly to GitHub Releases, Vercel, or any webhook with a single click.</p>
                <div className="text-xs text-zinc-500">GitHub Releases • Webhooks • CI-friendly</div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="px-6 py-12 border-t border-white/5">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-extrabold text-white">10k+</div>
              <div className="text-xs text-zinc-500 mt-2">Changelogs</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">500+</div>
              <div className="text-xs text-zinc-500 mt-2">OSS Repos</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">99%</div>
              <div className="text-xs text-zinc-500 mt-2">Time Saved</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">2.4k</div>
              <div className="text-xs text-zinc-500 mt-2">GitHub Stars</div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto rounded-2xl bg-[#070707] border border-white/5 p-10 text-center">
            <h2 className="text-3xl font-extrabold text-white mb-4">Automate your legacy.</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto mb-8">Join elite developer teams saving hours every single sprint. Experience the liquid interface of OpenLog today.</p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/sign-up" className="px-6 py-3 rounded-full bg-[#FF4F4F] text-white font-semibold">Get Started Free</Link>
              <a href="/docs" className="px-6 py-3 rounded-full border border-white/10 text-white/90">Read Docs</a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-zinc-500 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">OL</div>
              <div>© {new Date().getFullYear()} OpenLog • Liquid Tools Inc.</div>
            </div>
            <div className="flex items-center gap-6">
              <a href="/privacy" className="hover:text-white">Privacy</a>
              <a href="https://github.com/PratikRai0101/open-log" target="_blank" rel="noreferrer" className="hover:text-white">GitHub</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
