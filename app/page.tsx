import Link from "next/link";
import { ArrowRight, Github, Sparkles, GitCommit, PenTool } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();

  // If user is already logged in, redirect to the dashboard/app
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-[#FF4F4F] selection:text-white">
      {/* NAV BAR */}
      <nav className="fixed top-0 w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-tight text-xl">OpenLog</span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Beta</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/PratikRai0101/open-log" target="_blank" rel="noreferrer" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
              <Github size={16} /> Star on GitHub
            </a>
            <Link href="/sign-in" className="text-sm font-medium text-white bg-white/10 hover:bg-white/20 transition-all px-4 py-2 rounded-lg border border-white/5">
              Log in
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center min-h-[80vh]">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#FF4F4F]/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 font-medium mb-8">
          <Sparkles size={14} className="text-[#FF4F4F]" />
          <span>Powered by Groq & Moonshot</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mb-6">
          Stop writing manual <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4F4F] to-rose-400">release notes.</span>
        </h1>
        
        <p className="text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          Connect your GitHub repo, select your commits, and let AI generate beautifully formatted changelogs in seconds. Edit natively. Publish instantly.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/sign-up" className="flex items-center gap-2 px-8 py-4 rounded-xl bg-[#FF4F4F] hover:bg-[#FF4F4F]/90 text-white font-bold text-lg shadow-lg shadow-red-500/20 transition-all hover:scale-105">
            Get Started for Free <ArrowRight size={18} />
          </Link>
          <a href="https://github.com/PratikRai0101/open-log" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-lg transition-all">
            <Github size={18} /> View Source
          </a>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-24 px-6 border-t border-white/5 bg-[#0A0A0B]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">A complete release workflow.</h2>
            <p className="text-zinc-400">Everything you need to ship updates faster, built for modern developers.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-[#050505] border border-white/5 flex flex-col items-start hover:border-white/10 transition-colors">
              <div className="size-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                <GitCommit className="text-blue-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Commit Selection</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                We pull your repository history directly from GitHub. Filter by Feat, Fix, or search specifically for the commits that matter.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-[#050505] border border-white/5 flex flex-col items-start hover:border-white/10 transition-colors">
              <div className="size-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                <Sparkles className="text-emerald-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Generation</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Choose your favorite LLM. Our custom prompts automatically categorize your commits into structured, readable release notes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-[#050505] border border-white/5 flex flex-col items-start hover:border-white/10 transition-colors">
              <div className="size-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
                <PenTool className="text-rose-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Rich Editing</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Don't just trust the AI. Polish the draft in our Notion-style BlockNote workstation before hitting the publish button.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-white/5 text-center">
        <p className="text-zinc-600 text-sm font-mono">
          Built with 🖤 by <a href="https://github.com/PratikRai0101" className="text-zinc-400 hover:text-white transition-colors">Pratik Rai</a>. Open source under the MIT License.
        </p>
      </footer>
    </div>
  );
}
