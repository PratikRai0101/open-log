"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });
import { 
  Check, 
  GitCommit, 
  Sparkles, 
  Copy, 
  RotateCcw, 
  FileText, 
  ChevronLeft, 
  PenLine, 
  Eye,
  Rocket
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { publishRelease } from "@/app/actions";

export type SimpleCommit = {
  hash: string;
  message: string;
  date: string;
  author_name: string;
  type: "feat" | "fix" | "chore" | "misc";
};

interface WorkstationProps {
  initialCommits: SimpleCommit[];
  repoName: string;
}

export default function ClientWorkstation({ initialCommits, repoName }: WorkstationProps) {
  // State
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generated, setGenerated] = useState<string>(""); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [totalChunks, setTotalChunks] = useState<number>(0);
  const [currentChunk, setCurrentChunk] = useState<number | null>(null);
  const [completedChunks, setCompletedChunks] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const polishedTimerRef = useRef<number | null>(null);
  const [showPolishedBadge, setShowPolishedBadge] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("preview"); // New: Tabs
  const [versionTag, setVersionTag] = useState("v1.0.0"); // New: Input field

  // Toggle selection logic
  function toggleCommit(hash: string) {
    const next = new Set(selected);
    if (next.has(hash)) next.delete(hash);
    else next.add(hash);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === initialCommits.length) setSelected(new Set());
    else setSelected(new Set(initialCommits.map(c => c.hash)));
  }

  // AI Generation
  async function handleGenerate() {
    if (selected.size === 0) return;
    setIsGenerating(true);
    setTotalChunks(0);
    setCompletedChunks(0);
    setCurrentChunk(null);
    setGenerated("");
    setViewMode("preview"); // Switch to preview to see the magic

    // Setup streaming request so we can show progressive output and chunk progress
    try {
      const selectedCommits = initialCommits.filter((c) => selected.has(c.hash));

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: repoName, commits: selectedCommits }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream from server");

      const decoder = new TextDecoder();
      let partial = "";
      let expectFinalReplace = false;

      const replaceGenerated = (newText: string, polished = false) => {
        try {
          // preserve scroll position as ratio to avoid jump/flicker
          const el = previewRef.current;
          let ratio = 0;
          if (el) {
            const { scrollTop, scrollHeight, clientHeight } = el;
            ratio = scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0;
          }
          setGenerated(newText);
          if (polished) {
            // show polished badge briefly
            setShowPolishedBadge(true);
            if (polishedTimerRef.current) window.clearTimeout(polishedTimerRef.current);
            polishedTimerRef.current = window.setTimeout(() => {
              setShowPolishedBadge(false);
              polishedTimerRef.current = null;
            }, 3000) as unknown as number;
          }
          // restore scroll after DOM updates
          requestAnimationFrame(() => {
            const el2 = previewRef.current;
            if (el2) {
              const { scrollHeight, clientHeight } = el2;
              el2.scrollTop = ratio * Math.max(1, (scrollHeight - clientHeight));
            }
          });
        } catch (e) {
          setGenerated(newText);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        // handle control JSON markers prefixed with ~~JSON~~
        if (chunk.startsWith("~~JSON~~")) {
          const lines = chunk.split(/\n+/).filter(Boolean);
          for (const ln of lines) {
            if (!ln.startsWith("~~JSON~~")) continue;
            try {
              const obj = JSON.parse(ln.replace(/^~~JSON~~/, ""));
              if (obj.meta) {
                setTotalChunks(obj.meta.totalChunks || 0);
              }
              if (obj.chunkIndex !== undefined) {
                setCurrentChunk(obj.chunkIndex);
              }
              if (obj.chunkDone !== undefined) {
                setCompletedChunks((prev) => Math.max(prev, obj.chunkDone + 1));
                setCurrentChunk(null);
              }
              if (obj.final) {
                // Next non-control content is the merged final changelog — replace instead of append
                expectFinalReplace = true;
              }
            } catch (e) {
              // ignore malformed control JSON
            }
          }
          continue;
        }

        // Normal content
        if (expectFinalReplace) {
          // Replace with final merged content and preserve scroll
          partial = chunk;
          replaceGenerated(partial, true);
          expectFinalReplace = false;
        } else {
          partial += chunk;
          setGenerated(partial);
        }
      }
    } catch (err) {
      console.error(err);
      setGenerated("## Error\nFailed to generate changelog.");
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }

  function handleCancel() {
    const controller = abortControllerRef.current;
    if (controller) {
      controller.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }

  // Publish Logic (Updated)
  async function handlePublish() {
    if (!generated) return;
    if (!versionTag) {
      alert("Please enter a version tag (e.g. v1.0.0)");
      return;
    }

    setIsGenerating(true);
    try {
      // Clean title from the first line (remove # or **)
      const title = generated.split('\n')[0].replace(/^[#*]+\s*/, '').replace(/\*\*/g, '') || "New Release";
      
      const result = await publishRelease(repoName, versionTag, title, generated);

      if ((result as any).success && (result as any).url) {
        if (confirm("🚀 Release Published Successfully! View on GitHub?")) {
          window.open((result as any).url, "_blank");
        }
      } else {
        alert("Error: " + ((result as any).error || JSON.stringify(result)));
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="h-screen flex bg-[#050505] text-zinc-300 overflow-hidden font-sans selection:bg-[#FF4F4F] selection:text-white">
      
      {/* LEFT PANEL: Sidebar */}
      <aside className="w-[400px] shrink-0 h-full flex flex-col border-r border-white/5 bg-[#0A0A0B]">
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0A0A0B]">
          <div className="flex items-center gap-3 overflow-hidden">
            <Link href="/" className="p-1.5 rounded-md hover:bg-white/5 text-zinc-500 hover:text-white transition-colors">
              <ChevronLeft size={16} />
            </Link>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-zinc-100 truncate text-sm">{repoName}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Select Commits</span>
            </div>
          </div>
          <div className="text-xs text-zinc-500 font-mono">{selected.size} / {initialCommits.length}</div>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-white/5 bg-[#050505]/50 flex justify-between items-center">
          <button onClick={toggleAll} className="text-[11px] font-medium text-zinc-500 hover:text-white transition-colors uppercase tracking-wide">
            {selected.size === initialCommits.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {initialCommits.map((c) => {
            const isSelected = selected.has(c.hash);
            return (
              <div key={c.hash} onClick={() => toggleCommit(c.hash)} className={`group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border ${isSelected ? "bg-[#FF4F4F]/5 border-[#FF4F4F]/20" : "bg-transparent border-transparent hover:bg-white/3"}`}>
                <div className={`mt-0.5 size-4 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-[#FF4F4F] border-[#FF4F4F]" : "border-white/10 group-hover:border-white/30"}`}>
                  {isSelected && <Check size={12} className="text-white stroke-[3]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-tight truncate ${isSelected ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-300"}`}>{c.message}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-600">
                    <span className="flex items-center gap-1"><GitCommit size={10}/> {c.author_name}</span>
                    <span>•</span>
                    <span>{c.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* RIGHT PANEL: Editor */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-[#050505]">
        {/* Header with Version Input */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md relative z-10">
          
          {/* Tabs: Write vs Preview */}
          <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/5">
             <button 
               onClick={() => setViewMode("edit")}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "edit" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}>
               <PenLine size={14} /> Write
             </button>
             <button 
               onClick={() => setViewMode("preview")}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "preview" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}>
               <Eye size={14} /> Preview
             </button>
          </div>

            <div className="flex items-center gap-3">
            {/* Version Input */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg focus-within:border-white/20 transition-colors">
                <span className="text-xs text-zinc-500 font-mono">Tag:</span>
                <input 
                  type="text" 
                  value={versionTag}
                  onChange={(e) => setVersionTag(e.target.value)}
                  className="bg-transparent border-none text-xs font-mono text-white w-16 focus:ring-0 p-0 placeholder-zinc-700"
                  placeholder="v1.0.0"
                />
            </div>

            {/* Action Buttons */}
              {/* Generate / Publish / Cancel / Regenerate Buttons */}
              {!generated && (
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || selected.size === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${selected.size === 0 ? "bg-white/5 text-zinc-600 cursor-not-allowed" : "bg-white text-black hover:bg-zinc-200"}`}
                >
                  {isGenerating ? <RotateCcw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                  Generate
                </button>
              )}

              {generated && (
                <>
                  <button 
                    onClick={handlePublish}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-medium rounded-lg transition-all shadow-[0_0_10px_rgba(35,134,54,0.3)]"
                  >
                    <Rocket size={14} /> Publish
                  </button>
                  <button
                    onClick={() => handleGenerate()}
                    disabled={isGenerating}
                    className="flex items-center gap-2 ml-2 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 text-zinc-300 hover:bg-white/7"
                    title="Regenerate (add/remove commits and generate again)"
                  >
                    <RotateCcw size={14} /> Regenerate
                  </button>
                </>
              )}

              {isGenerating && (
                <button
                  onClick={handleCancel}
                  className="ml-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/5 text-zinc-200 hover:bg-white/7"
                >
                  Cancel
                </button>
              )}
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
              {generated ? (
            viewMode === "preview" ? (
              // PREVIEW MODE
              <div ref={previewRef} className="h-full overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-3xl mx-auto bg-[#0A0A0B] border border-white/10 rounded-xl p-8 shadow-2xl relative">
                  {showPolishedBadge && (
                    <div className="absolute right-6 top-6 bg-emerald-700/90 text-white px-3 py-1 rounded-md text-xs font-medium shadow-md">
                      Polished
                    </div>
                  )}
                  <div className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-400 prose-li:text-zinc-300">
                    <ReactMarkdown>{generated}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ) : (
              // EDIT MODE — BlockNote rich editor
              <div className="h-full overflow-y-auto custom-scrollbar p-4">
                <Editor initialMarkdown={generated} onChange={(val: string) => setGenerated(val)} />
              </div>
            )
          ) : (
            // EMPTY STATE
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-8">
              <Sparkles size={32} className="text-zinc-500 mb-4" />
              <p className="text-sm text-zinc-500">Select commits and click Generate</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
