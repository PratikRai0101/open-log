"use client";

import React, { useEffect, useRef } from "react";
import { Zap } from "lucide-react";

type Props = { imageSrc?: string; screenshotOnly?: boolean };

export default function HeroProductShot({ imageSrc = "/hero-screenshot.png", screenshotOnly = false }: Props) {
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Parallax: subtle vertical translate for depth
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (indicatorRef.current) {
        indicatorRef.current.style.transform = `translateY(${y * -0.03}px) translateX(-50%)`;
      }
      if (containerRef.current) {
        containerRef.current.style.transform = `translateY(${y * -0.02}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Stagger reveal for small elements (if present)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const lines = Array.from(el.querySelectorAll<HTMLDivElement>(".commit-line"));
    lines.forEach((ln, i) => {
      ln.style.opacity = "0";
      ln.style.transform = "translateY(8px)";
      setTimeout(() => {
        ln.style.transition = "opacity 360ms cubic-bezier(.2,.9,.2,1), transform 360ms cubic-bezier(.2,.9,.2,1)";
        ln.style.opacity = "1";
        ln.style.transform = "translateY(0)";
      }, 80 + i * 100);
    });
  }, []);

  // Screenshot-only reveal animation
  useEffect(() => {
    if (!screenshotOnly) return;
    const el = containerRef.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(12px)";
    setTimeout(() => {
      el.style.transition = "opacity 520ms cubic-bezier(.2,.9,.2,1), transform 520ms cubic-bezier(.2,.9,.2,1)";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, 60);
  }, [screenshotOnly]);

  if (screenshotOnly) {
    return (
      <div className="mt-14">
        <div ref={containerRef} className="relative mx-auto max-w-6xl w-full rounded-2xl p-6 shadow-2xl overflow-visible">
          <div className="relative mx-auto w-[92%] max-w-6xl rounded-2xl bg-[#070707]/60 border border-white/6 glass-card p-4">
            {/* browser chrome */}
            <div className="flex items-center gap-2 px-3 pb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
            </div>

            <div className="rounded-xl overflow-hidden mt-2 relative">
              <img src={imageSrc} alt="Product screenshot" className="w-full h-[420px] object-cover block shadow-2xl" />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-black/10 to-black/40 mix-blend-overlay"></div>
            </div>

            {/* reflection - mirrored blurred image faded out */}
            <div className="mt-4 overflow-hidden rounded-b-2xl">
              <img src={imageSrc} alt="reflection" className="w-full h-24 object-cover transform scale-y-[-1] opacity-10 blur-sm" />
            </div>

            {/* subtle reflection overlay */}
            <div className="absolute left-0 right-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent opacity-40 pointer-events-none rounded-b-2xl"></div>

            {/* corner star button (on top of screenshot) */}
            <a
              href="https://github.com/PratikRai0101/open-log"
              target="_blank"
              rel="noreferrer"
              className="absolute right-6 top-6 z-40 inline-flex items-center gap-3 px-3 py-2 rounded-full bg-[#0A0A0B]/80 border border-white/8 text-sm text-zinc-200 shadow-sm backdrop-blur-sm hover:scale-105 transition-transform"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black/60 border border-white/8 text-amber-400">★</span>
              <div className="hidden sm:flex flex-col text-xs leading-tight">
                <span className="opacity-80">Star</span>
                <span className="font-medium">on GitHub</span>
              </div>
              <div className="ml-3 px-2 py-1 rounded-full bg-black/60 text-xs font-medium text-white/90">2.4k</div>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-14">
      <div className="relative mx-auto max-w-6xl w-full rounded-2xl border border-white/6 bg-gradient-to-b from-black/40 to-transparent p-6 backdrop-blur-md shadow-2xl overflow-hidden hero-inner-glow">
        <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-20">
          <div className="rounded-xl border border-white/5 p-6 bg-[#050505]">
            <div className="flex items-center gap-2 mb-4 text-xs font-mono text-zinc-500">
              <span className="px-2 py-1 rounded bg-white/3">git_log --pretty=oneline</span>
              <span className="ml-auto text-zinc-400">master</span>
            </div>
            <div className="space-y-2 text-sm font-mono text-zinc-400">
              <div className="commit-line flex items-start gap-3">
                <div className="w-8 text-xs text-rose-400">a7f23c1</div>
                <div className="flex-1">feat: fixed the bug in the auth hook and some minor stuff</div>
              </div>
              <div className="commit-line flex items-start gap-3">
                <div className="w-8 text-xs text-emerald-400">b1e9a2b</div>
                <div className="flex-1">chore: update docs for readme and contrib</div>
              </div>
              <div className="commit-line flex items-start gap-3">
                <div className="w-8 text-xs text-zinc-500">2c8b1a9</div>
                <div className="flex-1">fix: small css tweak in navigation bar dropdown</div>
              </div>
              <div className="commit-line flex items-start gap-3">
                <div className="w-8 text-xs text-zinc-500">8c5a1f</div>
                <div className="flex-1">refactor: clean up logic in session middleware</div>
              </div>
            </div>
          </div>

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

        {/* center indicator */}
        <div ref={indicatorRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-rose-500/40 to-rose-600/30 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-xl pulse-indicator">
            <div className="w-12 h-12 rounded-full bg-black/50 border border-rose-400/30 flex items-center justify-center">
              <Zap className="text-rose-400" size={20} />
            </div>
          </div>
        </div>

        {/* optional screenshot overlay (behind content) */}
        <img src={imageSrc} alt="Product screenshot" className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none z-0 rounded-2xl" />
      </div>
    </div>
  );
}
