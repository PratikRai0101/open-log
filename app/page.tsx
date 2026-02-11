import Link from "next/link";
import {
  ArrowRight,
  Github,
  PlayCircle,
  Sparkles,
  GitCommit,
  PenTool,
  Database,
  Edit3,
  Zap,
  Code,
  GitPullRequest,
  Star,
} from "lucide-react";
import HeroProductShot from "../components/HeroProductShot";
import dynamic from "next/dynamic";
const PlayDemoButton = dynamic(() => import("../components/PlayDemoButton"), { ssr: false });
import { OpenLogLogo } from "../components/OpenLogLogo";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  // Fetch GitHub repo metadata (stargazers, forks, watchers, open issues)
  // once per hour so we can display up-to-date stats on the landing page.
  // Server-side fetch avoids exposing client-side rate limits.
  let starsDisplay = null as string | null;
  let forksDisplay = null as string | null;
  let issuesDisplay = null as string | null;
  let watchersDisplay = null as string | null;
  try {
    const gh = await fetch("https://api.github.com/repos/PratikRai0101/open-log", { next: { revalidate: 3600 } });
    if (gh.ok) {
      const data = await gh.json();
      const fmt = (v: number) => {
        if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
        if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`;
        return String(v);
      };
      const stars = Number(data.stargazers_count || 0);
      const forks = Number(data.forks_count || 0);
      const issues = Number(data.open_issues_count || 0);
      // subscribers_count is the number of people watching (not stargazers)
      const watchers = Number(data.subscribers_count || data.watchers_count || 0);

      starsDisplay = fmt(stars);
      forksDisplay = fmt(forks);
      issuesDisplay = fmt(issues);
      watchersDisplay = fmt(watchers);
    }
  } catch (e) {
    // ignore network errors — fallback to null (UI will keep placeholders)
    starsDisplay = forksDisplay = issuesDisplay = watchersDisplay = null;
  }

  // video state: note — this component is server-side; we render a client play button via a small client-only wrapper below

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-[#FF4F4F] selection:text-white overflow-x-hidden">
      {/* Header: Full-width fixed navbar per brand guidelines */}
      <header className="fixed top-0 w-full h-16 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <a href="/" aria-label="OpenLog home" className="flex items-center">
              <OpenLogLogo />
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com/PratikRai0101/open-log" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-200 hover:text-white">
              <span className="text-amber-400">★</span>
              <span className="font-medium">Star on GitHub</span>
              {starsDisplay && <span className="ml-2 text-xs text-zinc-400 font-mono">{starsDisplay}</span>}
            </a>

            <Link href="/sign-in" className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm text-white">Login</Link>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* inner container: allow content to flow so browser native scroll is used */}
        <div>
        {/* HERO */}
        <section className="relative px-6 min-h-[calc(100vh-4rem)] flex items-center py-12">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/3 border border-white/10 text-xs text-zinc-400 font-medium mb-6">
              <Sparkles size={14} className="text-[#FF4F4F]" />
              <span className="flex items-center gap-2">Build with Love <span aria-hidden className="text-rose-400 heart-animate">❤️</span></span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mb-6" style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', letterSpacing: '-0.02em' }}>
              <span className="block text-zinc-400">Meet OpenLog<span className="text-[#FF4D4D]">.</span></span>
              <span className="block text-3xl md:text-5xl mt-2">The end of manual release notes.</span>
            </h1>

            <p className="text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed items-center justify-center flex mx-auto">
              Stop copy-pasting raw commits. Connect your repository, select your updates, and let AI generate beautifully formatted changelogs in seconds. Built for power users.
            </p>

            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Primary CTA */}
                <Link href="/sign-in" className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#FF4D4D] hover:bg-[#FF4D4D]/90 text-white font-bold shadow-lg shadow-red-500/20 transition-all hover:scale-105">
                  Try it out now <ArrowRight size={16} />
                </Link>

                {/* Play Demo CTA */}
                <PlayDemoButton />
              </div>
              {/* Subtle GitHub CTA underneath */}
              <a href="https://github.com/PratikRai0101/open-log" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/6 text-sm font-medium transition-all mt-2">
                <Github size={16} /> View GitHub Repo
              </a>
            </div>

            <div className="mt-14">
              {/* HeroProductShot handles the fancy product shot with parallax + screenshot overlay */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <div>
                <script type="module" />
              </div>
                <div className="mt-6 relative">
                  {/* show the real app screenshot plainly for clarity (no overlaid CTA) */}
                  <img src="/hero-screenshot.png" alt="OpenLog screenshot" className="mx-auto mt-6 w-[92%] max-w-6xl rounded-2xl shadow-2xl object-contain z-20" />
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
              <div className="text-3xl font-extrabold text-white">{starsDisplay ?? '—'}</div>
              <div className="text-xs text-zinc-500 mt-2">GitHub Stars</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">{forksDisplay ?? '—'}</div>
              <div className="text-xs text-zinc-500 mt-2">Forks</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">{watchersDisplay ?? '—'}</div>
              <div className="text-xs text-zinc-500 mt-2">Watchers</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white">{issuesDisplay ?? '—'}</div>
              <div className="text-xs text-zinc-500 mt-2">Open Issues</div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="px-6 py-20">
          <div className="max-w-5xl mx-auto rounded-2xl bg-[#070707] border border-white/5 p-10 text-center">
            <h2 className="text-3xl font-extrabold text-white mb-4">Automate your legacy.</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto mb-8">Join elite developer teams saving hours every single sprint. Experience the liquid interface of OpenLog today.</p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/sign-in" className="px-6 py-3 rounded-full bg-[#FF4F4F] text-white font-semibold">Get Started Free</Link>
              {/* Read Docs -> direct link to repository README on GitHub */}
              <a href="https://github.com/PratikRai0101/open-log#readme" target="_blank" rel="noreferrer" className="px-6 py-3 rounded-full border border-white/10 text-white/90">Read Docs</a>
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
        </div>
      </main>
    </div>
  );
}
