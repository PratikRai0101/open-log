import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <>
      {/* Fonts & material icons (kept here to match the reference) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <div className="font-display bg-obsidian text-white selection:bg-primary/30 antialiased min-h-screen">
        <div className="fixed inset-0 grain-overlay z-[100]" />
        <div className="fixed inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-500/5 rounded-full blur-[120px]" />
        </div>

        {/* Centered pill nav */}
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-auto max-w-4xl z-[110] px-2 py-2 flex items-center bg-[#0A0A0B]/80 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 pl-4 pr-6 border-r border-white/5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF4F4F] shadow-[0_0_8px_rgba(255,79,79,0.5)]" />
            <span className="text-base font-bold tracking-tight text-white/90">OpenLog</span>
          </div>
          <div className="hidden md:flex items-center gap-1 px-2">
            <a className="px-4 py-2 rounded-full text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300" href="#">Features</a>
            <a className="px-4 py-2 rounded-full text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300" href="#">Changelog</a>
            <a className="px-4 py-2 rounded-full text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300" href="#">Docs</a>
          </div>
          <div className="flex items-center gap-3 pl-4 pr-1">
            <a className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs text-white/80 group" href="https://github.com/PratikRai0101/open-log" target="_blank" rel="noreferrer">
              <span className="material-symbols-outlined text-[14px] group-hover:text-yellow-400 transition-colors">star</span>
              <span className="hidden lg:inline">Star on GitHub</span>
              <span className="bg-black/30 px-1.5 rounded text-[10px] text-white/40">2.4k</span>
            </a>
            <Link href="/sign-in" className="ml-2">
              <button className="bg-[#1A1A1A] hover:bg-[#252525] border border-white/10 text-white px-5 py-2 rounded-full text-sm font-medium tracking-wide transition-all">Login</button>
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="relative pt-40 pb-20 px-4 z-10 overflow-hidden min-h-[90vh] flex flex-col items-center text-center">
          <div className="absolute top-[40%] anamorphic-flare opacity-50 pointer-events-none" />
          <div className="relative z-10 text-center max-w-5xl mx-auto space-y-8 mt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:border-white/20 transition-colors">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[10px] tracking-widest uppercase text-white/60">v2.0 Liquid Glass Engine</span>
            </div>

            <h1 className="text-5xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-gray-400 drop-shadow-2xl">
              Ship release notes.<br />
              <span className="text-white/40">Not raw commits.</span>
            </h1>

            <p className="max-w-xl mx-auto text-lg text-white/50 font-light leading-relaxed">
              Transform your git history into a beautiful, readable changelog. Powered by semantic analysis and our liquid rendering engine.
            </p>

            <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-4">
              <a href="https://github.com/PratikRai0101/open-log" target="_blank" rel="noreferrer" className="px-8 py-4 bg-white text-black rounded-lg font-bold text-base hover:scale-105 transition-transform duration-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.597 1.028 2.688 0 3.848-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path></svg>
                Get Started with GitHub
              </a>
            </div>
          </div>

          {/* Product shot (inline from reference) */}
          <div className="w-full max-w-6xl mt-24 px-4 perspective-container z-20">
            <div className="perspective-content relative w-full aspect-[16/10] bg-[#0A0A0A] rounded-xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden group">
              <div className="absolute inset-0 bg-glass-shine pointer-events-none z-30" />
              <div className="absolute inset-0 border border-white/5 rounded-xl z-30 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-primary/5 blur-[120px] pointer-events-none" />
              <div className="absolute inset-0 flex bg-obsidian">
                <div className="w-[45%] h-full border-r border-white/10 bg-black/80 backdrop-blur-sm p-6 font-mono text-[10px] sm:text-xs text-white/50 relative overflow-hidden flex flex-col">
                  <div className="flex gap-1.5 mb-6 opacity-60">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="space-y-3 opacity-90 flex-1 relative">
                    <div className="absolute top-0 left-0 w-full h-[2px] z-20 animate-scan scanning-beam shadow-[0_0_15px_#FF4F4F]" />
                    <div className="flex gap-3 items-center text-white/40 font-mono"><span className="text-primary/80">●</span> <span className="hl-string">"feat: init project"</span> <span className="ml-auto text-white/30">3m</span></div>
                    <div className="flex gap-3 items-center"><span className="text-primary font-bold shadow-[0_0_10px_#FF4F4F]">●</span> <span className="hl-keyword font-bold">fix: recursive loop</span> <span className="ml-auto text-white/60">2h</span></div>
                    <div className="flex gap-3 items-center"><span className="text-primary/80">●</span> <span className="hl-comment">chore: update deps</span> <span className="ml-auto text-white/30">4h</span></div>
                    <div className="flex gap-3 items-center"><span className="text-primary/80">●</span> <span className="hl-function">style: padding(2)</span> <span className="ml-auto text-white/30">5h</span></div>
                    <div className="flex gap-3 items-center"><span className="text-primary/80">●</span> <span className="hl-class">refactor: UserCtrl</span> <span className="ml-auto text-white/30">1d</span></div>
                    <div className="flex gap-3 items-center"><span className="text-primary/80">●</span> <span className="hl-string">doc: readme update</span> <span className="ml-auto text-white/30">1d</span></div>
                    <div className="flex gap-3 items-center text-white/40"><span className="text-primary/80">●</span> <span className="hl-keyword">test: add unit tests</span> <span className="ml-auto text-white/30">2d</span></div>
                    <div className="flex gap-3 items-center text-white/40"><span className="text-primary/80">●</span> <span className="hl-operator">fix: typo in footer</span> <span className="ml-auto text-white/30">2d</span></div>
                  </div>
                  <div className="mt-auto pt-4 border-t border-white/5 text-white/40 flex justify-between font-mono text-xs">
                    <span>master</span>
                    <span><span className="text-primary">98</span> commits</span>
                  </div>
                </div>
                <div className="w-[55%] h-full bg-[#080808] p-8 relative flex flex-col border-l border-white/5">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="text-[10px] font-mono text-primary uppercase tracking-widest mb-2 font-bold drop-shadow-md">Released just now</div>
                      <h3 className="text-3xl font-bold text-white tracking-tight liquid-glass-text drop-shadow-xl">v2.4.0 — Onyx</h3>
                    </div>
                    <div className="px-3 py-1 rounded bg-green-900/20 border border-green-500/20 text-green-400 text-[10px] font-mono uppercase font-bold tracking-wide shadow-[0_0_10px_rgba(74,222,128,0.1)]">Stable</div>
                  </div>
                  <div className="space-y-6 relative z-10">
                    <div className="p-5 rounded-lg bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl relative group hover:bg-white/[0.05] transition-colors shadow-lg">
                      <div className="absolute -left-[1px] top-4 bottom-4 w-[3px] bg-primary rounded-full shadow-[0_0_10px_#FF4F4F]" />
                      <h4 className="text-lg font-bold text-white mb-2 pl-3 tracking-tight">Authentication Engine Rewrite</h4>
                      <p className="text-white/80 text-sm leading-relaxed pl-3 font-medium font-sans">Fixed critical recursive loop issues in the <code className="bg-white/10 px-1 rounded text-xs">JWT</code> handler. Session tokens now persist correctly across subdomains.</p>
                    </div>
                    <div className="pl-2">
                      <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-sm text-blue-400 drop-shadow-md">diamond</span>Improvements</h4>
                      <ul className="space-y-3 text-sm text-white/70 list-none font-medium">
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white/50 rounded-full" /> Updated dependency tree for security patches</li>
                        <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white/50 rounded-full" /> Refactored user controller for 2x faster queries</li>
                      </ul>
                    </div>
                  </div>
                  <div className="absolute bottom-8 right-8 flex gap-2">
                    <div className="px-3 py-2 bg-[#111] backdrop-blur-md border border-white/10 rounded-lg shadow-2xl flex items-center gap-3">
                      <span className="material-symbols-outlined text-white/60 text-sm hover:text-white cursor-pointer transition-colors">format_bold</span>
                      <span className="material-symbols-outlined text-white/60 text-sm hover:text-white cursor-pointer transition-colors">format_italic</span>
                      <div className="w-[1px] h-4 bg-white/20" />
                      <span className="material-symbols-outlined text-primary text-sm cursor-pointer hover:scale-110 transition-transform shadow-[0_0_10px_rgba(255,79,79,0.5)] rounded-full">send</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Designed for section & cards (kept concise) */}
        <section className="py-32 px-4 max-w-7xl mx-auto z-10 relative">
          <div className="mb-20 text-left">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white mb-6">Designed for <br /><span className="text-white/40">clarity and speed.</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-4 lg:col-span-2 glass-panel rounded-3xl p-1 relative overflow-hidden group bg-zinc-900/50 border-white/5">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-blue-500/5 opacity-50" />
              <div className="bg-[#080808]/40 backdrop-blur-xl rounded-[20px] p-8 h-full border border-white/5 relative overflow-hidden flex flex-col justify-between">
                <div className="mb-8">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-6 text-white border border-white/10">
                    <span className="material-symbols-outlined text-sm">edit_note</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Notion-Style Workstation</h3>
                  <p className="text-white/50 text-sm leading-relaxed max-w-sm">A rich, block-based editor to polish your drafts before hitting publish.</p>
                </div>
                <div className="relative w-full bg-[#050505] rounded-xl border border-white/10 p-6 shadow-2xl mt-auto">
                  <div className="font-display space-y-3">
                    <h4 className="text-lg font-bold text-white/90">Introducing Dark Mode</h4>
                    <div className="flex items-center gap-2 text-white/40 group/line">
                      <p className="text-sm">We've finally added a native dark mode toggle.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 lg:col-span-1 glass-panel rounded-3xl p-8 relative overflow-hidden group bg-zinc-900/50 border-white/5 flex flex-col h-[500px]">
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-6 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 leading-tight">Multi-Model<br/>AI</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-8">Route your commits through Google Gemini, Groq (Llama 3), or Moonshot.</p>
                <div className="mt-auto w-full">
                  <div className="bg-[#111] rounded-xl border border-white/10 p-4 backdrop-blur-xl relative group-hover:bg-[#161616] transition-colors duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 shrink-0">
                        <span className="material-symbols-outlined text-xs animate-pulse">smart_toy</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-white/90 font-medium leading-tight">Analyzing 42 commits with Gemini 1.5</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 lg:col-span-1 glass-panel rounded-3xl p-8 relative overflow-hidden group bg-zinc-900/50 border-white/5 flex flex-col h-[500px]">
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-6 text-white border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                  <span className="material-symbols-outlined text-sm">rocket_launch</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 leading-tight">Instant<br/>Sync</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-8">Push to GitHub Releases, Slack, and Discord with a single click.</p>
                <div className="mt-auto flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-10 h-10 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-lg">terminal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Powered by */}
        <section className="py-24 border-y border-white/5 bg-black/40 relative">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-mono text-white/30 uppercase tracking-widest mb-12">Powered by</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2 group cursor-default"><span className="material-symbols-outlined text-3xl group-hover:text-white transition-colors">code</span><span className="text-xl font-bold text-white/50 group-hover:text-white transition-colors">GitHub</span></div>
              <div className="flex items-center gap-2 group cursor-default"><span className="material-symbols-outlined text-3xl group-hover:text-white transition-colors">bolt</span><span className="text-xl font-bold text-white/50 group-hover:text-white transition-colors">Next.js</span></div>
              <div className="flex items-center gap-2 group cursor-default"><span className="material-symbols-outlined text-3xl group-hover:text-white transition-colors">lock</span><span className="text-xl font-bold text-white/50 group-hover:text-white transition-colors">Clerk</span></div>
              <div className="flex items-center gap-2 group cursor-default"><span className="material-symbols-outlined text-3xl group-hover:text-white transition-colors">smart_toy</span><span className="text-xl font-bold text-white/50 group-hover:text-white transition-colors">Gemini</span></div>
              <div className="flex items-center gap-2 group cursor-default"><span className="material-symbols-outlined text-3xl group-hover:text-white transition-colors">memory</span><span className="text-xl font-bold text-white/50 group-hover:text-white transition-colors">Groq</span></div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 px-4 relative flex justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative z-10 glass-panel max-w-2xl w-full rounded-2xl p-12 text-center border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center">
            <h2 className="text-4xl font-bold tracking-tight mb-4">Ready to narrate your work?</h2>
            <p className="text-white/50 mb-8">Join thousands of developers shipping beautiful release notes today.</p>
            <a href="https://github.com/PratikRai0101/open-log" target="_blank" rel="noreferrer" className="w-full sm:w-auto px-10 py-5 bg-white text-black rounded-lg font-bold text-lg hover:scale-105 transition-transform duration-200 shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.597 1.028 2.688 0 3.848-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path></svg>
              Get Started with GitHub
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-8 border-t border-white/5 bg-black">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center"><span className="text-white font-bold text-xs">O</span></div>
              <span className="text-sm font-mono text-white/40">© {new Date().getFullYear()} OpenLog Inc.</span>
            </div>
            <div className="flex gap-6 text-xs font-mono text-white/40 uppercase tracking-wider">
              <a className="hover:text-white transition-colors" href="#">Privacy</a>
              <a className="hover:text-white transition-colors" href="#">Terms</a>
              <a className="hover:text-white transition-colors" href="#">Twitter</a>
              <a className="hover:text-white transition-colors" href="#">GitHub</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
