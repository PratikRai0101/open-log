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
  Star,
} from "lucide-react";
import HeroProductShot from "../components/HeroProductShot";
import dynamic from "next/dynamic";
import PlayDemoButton from "../components/PlayDemoButton";
import { OpenLogIcon } from "../components/OpenLogIcon";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  // video state: note — this component is server-side; we render a client play button via a small client-only wrapper below

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-[#FF4F4F] selection:text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#000000]/60 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Replace simple text logo with the branded logo SVG */}
              <a href="/" className="flex items-center gap-3">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                  <path d="M14 6H10C7.79 6 6 7.79 6 10V22C6 24.21 7.79 26 10 26H14" stroke="#71717A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18 6H22C24.21 6 26 7.79 26 10V22C26 24.21 24.21 26 22 26H18V6Z" fill="#FF4D4D" fillOpacity="0.2" />
                  <path d="M18 6H22C24.21 6 26 7.79 26 10V22C26 24.21 24.21 26 22 26H18" stroke="#FF4D4D" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-white font-semibold tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk), sans-serif' }}>OpenLog</span>
              </a>
            </div>
          <div className="flex items-center gap-4">
            {/* Intentionally empty to keep header spacing — main nav is centered in the pill */}
            <div className="h-8" />
          </div>
        </div>
        {/* Centered pill navigation */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-3 pointer-events-none w-full flex justify-center">
          <div className="relative pointer-events-auto inline-flex items-center gap-6 px-5 py-2 rounded-full bg-[#000000]/60 border border-white/6 backdrop-blur-sm shadow-md text-sm text-zinc-300">
            <div className="inline-flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-rose-500 block" />
              <span className="text-white font-semibold">OpenLog</span>
            </div>
            {/* compact star pill (matches provided reference) - positioned to the right */}
            <a href="https://github.com/PratikRai0101/open-log" target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-3 px-3 py-1 rounded-full bg-[#070707]/80 border border-white/8 text-sm text-zinc-200 shadow-sm">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black/60 border border-white/8 text-amber-400">★</span>
              <div className="flex flex-col leading-tight text-xs">
                <span className="opacity-80">Star</span>
                <span className="font-medium">on GitHub</span>
              </div>
              <div className="ml-2 px-2 py-1 rounded-full bg-black/60 text-xs font-medium text-white/90">2.4k</div>
            </a>
            <nav className="flex items-center gap-4 text-zinc-300">
              <a className="hover:text-white">Features</a>
              <a className="hover:text-white">Changelog</a>
              <a className="hover:text-white">Docs</a>
            </nav>
            
            <Link href="/sign-in" className="ml-2 px-3 py-1 rounded-md bg-white/3 text-sm">Login</Link>
          </div>
        </div>
      </header>

      <main className="pt-24">
        {/* inner container: allow content to flow so browser native scroll is used */}
        <div>
        {/* HERO */}
        <section className="relative px-6 pt-12 pb-24 min-h-[calc(100vh-4rem)] flex items-center">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/3 border border-white/10 text-xs text-zinc-400 font-medium mb-6">
              <Sparkles size={14} className="text-[#FF4F4F]" />
              <span className="flex items-center gap-2">Build with Love <span aria-hidden className="text-rose-400 heart-animate">❤️</span></span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mb-6 flex flex-col items-center">
              <span className="flex items-center gap-3">
                <OpenLogIcon className="w-10 h-10" />
                Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4F4F] to-rose-400">OpenLog.</span>
              </span>
              <span className="mt-2">The end of manual release notes.</span>
            </h1>

            <p className="text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed">
              Stop copy-pasting raw commits. Connect your repository, select your updates, and let AI generate beautifully formatted changelogs in seconds. Built for power users.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-4">
                <Link href="/sign-in" className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#FF4F4F] hover:bg-[#FF4F4F]/90 text-white font-semibold shadow-sm transition">Try it out now <ArrowRight size={16} /></Link>
                <PlayDemoButton />
              </div>
              <a href="https://github.com/PratikRai0101/open-log" target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 text-white/90 font-medium">View GitHub Repo</a>
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
              <Link href="/sign-in" className="px-6 py-3 rounded-full bg-[#FF4F4F] text-white font-semibold">Get Started Free</Link>
              <a href="https://github.com/PratikRai0101/open-log?tab=readme-ov-file" className="px-6 py-3 rounded-full border border-white/10 text-white/90">Read Docs</a>
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
