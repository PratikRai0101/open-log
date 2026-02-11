"use client";

import React, { useEffect, useRef } from "react";
import { Zap } from "lucide-react";

type Props = { imageSrc?: string };

export default function HeroProductShot({ imageSrc = "/hero-screenshot.png" }: Props) {
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Simple parallax: move the indicator slightly based on scroll position
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (indicatorRef.current) {
        // translate less for subtle parallax
        indicatorRef.current.style.transform = `translateY(${y * -0.03}px) translateX(-50%)`;
      }
      if (containerRef.current) {
        containerRef.current.style.transform = `translateY(${y * -0.02}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Stagger reveal for commit lines
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

    // reveal the release notes column slightly after commit lines
    const release = el.querySelector<HTMLDivElement>(".release-col");
    if (release) {
      release.style.opacity = "0";
      release.style.transform = "translateY(6px)";
      setTimeout(() => {
        release.style.transition = "opacity 420ms cubic-bezier(.2,.9,.2,1), transform 420ms cubic-bezier(.2,.9,.2,1)";
        release.style.opacity = "1";
        release.style.transform = "translateY(0)";
      }, 300 + lines.length * 90);
    }
  }, []);

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
        <img src={imageSrc} alt="Product screenshot" className="absolute left-1/2 transform -translate-x-1/2 bottom-0 w-[92%] h-auto max-h-[420px] object-cover opacity-100 pointer-events-none z-0 rounded-2xl shadow-2xl" />
      </div>
    </div>
  );
}
