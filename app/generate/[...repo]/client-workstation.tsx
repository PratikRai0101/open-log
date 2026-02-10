"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
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
  Lock,
  Rocket,
  Search,
  User,
  Calendar,
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
  const saveTimerRef = useRef<number | null>(null);
  const [showPolishedBadge, setShowPolishedBadge] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [savedDraft, setSavedDraft] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("preview"); // New: Tabs
  const [versionTag, setVersionTag] = useState("v1.0.0"); // New: Input field
  const editorRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");

  const filteredCommits = initialCommits.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (activeTab !== "ALL") {
      if (activeTab === "FEAT" && c.type !== "feat") return false;
      if (activeTab === "FIX" && c.type !== "fix") return false;
    }
    if (!q) return true;
    return (
      c.message.toLowerCase().includes(q) ||
      c.author_name.toLowerCase().includes(q) ||
      c.hash.toLowerCase().startsWith(q)
    );
  });

  // Load autosaved draft on mount (if any)
  useEffect(() => {
    try {
      const key = `openlog:changelog:${repoName}`;
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(key);
        if (saved) {
          setSavedDraft(saved);
          if (!generated) setGenerated(saved);
          setLastSavedAt(Date.now());
        }
      }
    } catch (e) {
      // noop
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave generated content to localStorage (debounced)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    // don't autosave empty content
    if (!generated) return;
    setSaving(true);
    saveTimerRef.current = window.setTimeout(() => {
      try {
        const key = `openlog:changelog:${repoName}`;
        localStorage.setItem(key, generated);
        setSavedDraft(generated);
        setLastSavedAt(Date.now());
      } catch (e) {
        // noop
      } finally {
        setSaving(false);
      }
    }, 800) as unknown as number;
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [generated, repoName]);

  // Helper to format relative time
  function formatAgo(ts: number | null) {
    if (!ts) return "";
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 5) return "just now";
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return `${h}h ago`;
  }

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

  // Keyboard shortcuts: Cmd/Ctrl+E to toggle edit/preview
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setViewMode((v) => (v === "edit" ? "preview" : "edit"));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      toast.error("Please enter a version tag (e.g. v1.0.0)");
      return;
    }

    setIsGenerating(true);
    try {
      // ensure we have the latest editor content before publishing
      if (editorRef.current && typeof editorRef.current.getMarkdown === "function") {
        try {
          const latest = await editorRef.current.getMarkdown();
          if (latest && latest !== generated) {
            setGenerated(latest);
          }
        } catch (e) {
          // ignore and proceed with current generated
        }
      }
      // Clean title from the first line (remove # or **)
      const title = generated.split('\n')[0].replace(/^[#*]+\s*/, '').replace(/\*\*/g, '') || "New Release";

      const result = await publishRelease(repoName, versionTag, title, generated);

      if ((result as any).success && (result as any).url) {
        try {
          // clear autosaved draft on successful publish
          const key = `openlog:changelog:${repoName}`;
          if (typeof window !== "undefined") localStorage.removeItem(key);
        } catch (e) {
          // noop
        }

        toast.success("Release Published Successfully!", {
          description: `Version ${versionTag} is now live.`,
          action: {
            label: "View on GitHub",
            onClick: () => window.open((result as any).url, "_blank"),
          },
          duration: 5000,
        });
      } else {
        toast.error("Publish Failed", { description: (result as any).error });
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-zinc-300 font-sans overflow-hidden selection:bg-[#FF4F4F] selection:text-white relative">
      
      {/* 1. TOP HEADER ROW (Global Controls) */}
      <header className="h-16 px-6 flex items-center justify-between shrink-0 z-20">
        {/* Left: Brand & Breadcrumbs */}
        <div className="flex items-center gap-4 text-sm">
           <div className="flex items-center gap-2 text-zinc-500">
             <div className="size-6 bg-white/10 rounded flex items-center justify-center text-white font-bold text-xs">SL</div>
             <span className="text-zinc-300 font-medium">ShipLog</span>
             <span>/</span>
             <span>{repoName}</span>
           </div>
           <div className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-zinc-400 font-mono">
             {versionTag || "v0.0.0"}
           </div>
        </div>

  {/* Center: Mode Toggles (The Floating Pill) */}
  <div className="bg-[#0A0A0B] border border-white/10 p-1 rounded-lg flex items-center gap-1">
    <button 
      onClick={() => setViewMode("edit")} 
      className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'edit' ? 'bg-[#FF4F4F] text-white shadow-lg shadow-red-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
      Write
    </button>
    <button 
      onClick={() => setViewMode("preview")} 
      className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'preview' ? 'bg-[#FF4F4F] text-white shadow-lg shadow-red-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
      Preview
    </button>
  </div>

  {/* Right: Actions */}
  <div className="flex items-center gap-3">
     <div className="flex items-center gap-2 text-[10px] text-zinc-500">
       <div className="size-2 rounded-full bg-emerald-500 animate-pulse"/>
       Live Sync
     </div>
     <div className="w-px h-4 bg-white/10 mx-2"/>
     <div className="size-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs text-white">
       <User size={14}/>
     </div>
  </div>
    </header>

    {/* 2. MAIN WORKSPACE (The Two Floating Panels) */}
    <div className="flex-1 flex items-stretch overflow-hidden">
      <div className="mx-auto w-full max-w-[1400px] flex gap-4 px-6 pb-2 min-h-0">
        {/* --- LEFT PANEL: SIDEBAR CARD --- */}
        <div className="w-[380px] bg-[#0A0A0B] border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden relative group">
           {/* Search & Tabs */}
           <div className="p-4 space-y-4 border-b border-white/5">
              <div className="relative">
                 <Search size={14} className="absolute left-3 top-2.5 text-zinc-600" />
                 <input 
                   className="w-full bg-[#151516] border border-white/5 rounded-lg py-2 pl-9 pr-10 text-xs text-zinc-300 focus:outline-none focus:border-white/10 transition-colors placeholder:text-zinc-700"
                   placeholder="Search commits..."
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
                 <span className="absolute right-3 top-2.5 text-[10px] text-zinc-700 border border-white/5 px-1 rounded">⌘K</span>
              </div>
              
              {/* Segmented Control Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-[#151516] p-1 rounded-lg">
                {["ALL", "FEAT", "FIX"].map(tab => (
                   <button
                     key={tab}
                     onClick={() => setActiveTab(tab as any)}
                     className={`py-1.5 text-[10px] font-bold rounded-md transition-all ${activeTab === tab ? 'bg-[#2A2A2B] text-zinc-100 shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}
                   >
                     {tab}
                   </button>
                ))}
              </div>
           </div>

           {/* Commit List */}
           <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {filteredCommits.map(c => {
                const isSelected = selected.has(c.hash);
                return (
                  <div key={c.hash} onClick={() => toggleCommit(c.hash)} className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${isSelected ? 'bg-[#FF4F4F]/5 border-[#FF4F4F]/20' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
                     <div className="flex items-center justify-between mb-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${c.type === 'feat' ? 'text-emerald-500' : c.type === 'fix' ? 'text-amber-500' : 'text-blue-500'}`}>{c.type}</span>
                        <span className="text-[10px] text-zinc-600 font-mono opacity-60">{c.hash.substring(0,6)}</span>
                     </div>
                     <p className={`text-xs leading-relaxed line-clamp-2 ${isSelected ? 'text-zinc-100' : 'text-zinc-400'}`}>{c.message}</p>
                  </div>
                )
              })}
           </div>

           {/* Sidebar Footer (Floating inside card) */}
           <div className="p-3 border-t border-white/5 bg-[#0A0A0B] flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">{selected.size} selected</span>
              {selected.size > 0 && <button onClick={() => setSelected(new Set())} className="text-[10px] text-[#FF4F4F] font-medium hover:underline">Clear</button>}
           </div>
        </div>

        {/* --- RIGHT PANEL: EDITOR CARD --- */}
        <div className="flex-1 bg-[#0A0A0B] border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden relative">
           {/* Editor Toolbar (Inside the card) */}
           <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0A0A0B]">
              <div className="flex items-center gap-3">
                 <div className="px-2 py-1 rounded bg-white/5 border border-white/5 text-xs text-zinc-400 font-mono">release_notes.md</div>
                 <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-bold tracking-wider">DRAFT</span>
              </div>
              <div className="flex items-center gap-2">
                 <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs font-medium text-zinc-400 transition-colors">
                    <Copy size={12}/> Copy
                 </button>
                 <button onClick={handleGenerate} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs font-medium text-zinc-400 transition-colors">
                    <RotateCcw size={12}/> Regenerate
                 </button>
                 <button onClick={handlePublish} className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#FF4F4F] to-[#DD3333] hover:from-[#E13333] hover:to-[#C02222] text-xs font-bold text-white shadow-lg shadow-red-900/20 transition-all ml-2">
                    <Rocket size={12}/> Publish
                 </button>
              </div>
           </div>

           {/* The Editor Canvas */}
           <div className="flex-1 overflow-hidden relative bg-[#0A0A0B]">
             {generated ? (
               <div className="h-full flex flex-col">
                 {/* Metadata Header inside the document */}
                 <div className="px-10 pt-10 pb-2">
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-3">Release Notes <span className="text-[#FF4F4F]">{versionTag}</span></h1>
                    <div className="flex items-center gap-6 text-xs text-zinc-500 font-mono">
                       <span className="flex items-center gap-2"><Calendar size={14}/> {new Date().toLocaleDateString()}</span>
                       <span className="flex items-center gap-2"><User size={14}/> ShipLog AI</span>
                    </div>
                 </div>
                 {/* The Actual Editor */}
                 <div className="flex-1 pl-6 pr-2">
                    <Editor 
                      ref={editorRef}
                      initialMarkdown={generated} 
                      onChange={setGenerated}
                      editable={viewMode === 'edit'}
                    />
                 </div>
               </div>
             ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30">
                   <Sparkles size={48} className="text-zinc-500 mb-4"/>
                   <p className="text-zinc-500 text-sm font-mono">Select commits to generate draft</p>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>

    {/* 3. GLOBAL COMMAND FOOTER */}
    <footer className="h-10 border-t border-white/5 bg-[#050505] flex items-center justify-between px-6 shrink-0 z-20">
       <div className="flex items-center gap-4 text-[10px] text-zinc-600 font-mono">
          <span className="flex items-center gap-1.5"><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-zinc-400 min-w-[20px] text-center">J</kbd> <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-zinc-400 min-w-[20px] text-center">K</kbd> Navigate</span>
          <span className="flex items-center gap-1.5"><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-zinc-400">SPACE</kbd> Select</span>
       </div>
       <div className="flex items-center gap-4 text-[10px] text-zinc-600 font-mono">
           <span className="flex items-center gap-1.5"><kbd className="bg-white/10 px-1.5 py-0.5 rounded text-zinc-400">CMD</kbd> <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-zinc-400">ENTER</kbd> Generate</span>
           <span className="flex items-center gap-2 text-zinc-700"><Sparkles size={10} className="text-[#FF4F4F]"/> Powered by Gemini 1.5</span>
       </div>
    </footer>

    </div>
  );
}
