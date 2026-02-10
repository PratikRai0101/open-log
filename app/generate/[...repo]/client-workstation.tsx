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
  const [editingVersion, setEditingVersion] = useState(false);
  const [versionDraft, setVersionDraft] = useState(versionTag);
  const versionInputRef = useRef<HTMLInputElement | null>(null);

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
    setVersionDraft(versionTag);
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

  // Focus version input when entering edit mode
  useEffect(() => {
    if (editingVersion && versionInputRef.current) {
      try { versionInputRef.current.focus(); versionInputRef.current.select(); } catch (e) {}
    }
  }, [editingVersion]);

  // Robust copy helper: try editorRef.getMarkdown(), fallback to generated, then savedDraft.
  async function handleCopy() {
    try {
      let text = "";
      if (editorRef.current && typeof editorRef.current.getMarkdown === "function") {
        try {
          text = await editorRef.current.getMarkdown();
        } catch (e) {
          // fallback
        }
      }
      if (!text) text = generated || savedDraft || "";

      if (!text) {
        toast.error("Nothing to copy");
        return;
      }

      // Primary: Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success("Copied release body to clipboard");
        return;
      }

      // Fallback: textarea + execCommand
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) toast.success("Copied release body to clipboard");
      else toast.error("Copy failed");
    } catch (e) {
      console.error(e);
      toast.error("Copy failed");
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-zinc-300 font-sans overflow-hidden">
      {/* GLOBAL HEADER */}
      <header className="h-14 px-5 flex items-center justify-between border-b border-white/5 bg-[#050505] shrink-0 z-20">
         <div className="flex items-center gap-3">
            <span className="font-bold text-zinc-100 tracking-tight">ShipLog</span>
            <span className="text-zinc-700">/</span>
            <span className="text-sm text-zinc-400 font-mono">{repoName}</span>
         </div>
         
         <div className="flex bg-[#0A0A0B] p-1 rounded-lg border border-white/5">
            <button onClick={() => setViewMode("edit")} className={`px-4 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'edit' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Write</button>
            <button onClick={() => setViewMode("preview")} className={`px-4 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'preview' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Preview</button>
         </div>

         <div className="flex items-center gap-3">
            {editingVersion ? (
              <div className="flex items-center gap-2">
                <input ref={versionInputRef} value={versionDraft} onChange={e => setVersionDraft(e.target.value)} className="bg-[#0B0B0C] border border-white/10 px-3 py-1 rounded text-sm text-white focus:outline-none" />
                <button onClick={() => { setVersionTag(versionDraft); setEditingVersion(false); toast.success('Version updated'); }} className="px-3 py-1 bg-[#0A0A0B] border border-white/10 rounded text-sm text-emerald-300">Save</button>
                <button onClick={() => { setVersionDraft(versionTag); setEditingVersion(false); }} className="px-3 py-1 bg-transparent border border-white/5 rounded text-sm text-zinc-400">Cancel</button>
              </div>
            ) : (
              <>
                <div className="px-2 py-1 bg-white/5 border border-white/5 rounded text-[10px] font-mono text-zinc-400">{versionTag || "v0.0.0"}</div>
                <div className="size-8 bg-zinc-800 rounded-full flex items-center justify-center text-xs text-zinc-400 border border-white/5"><User size={14}/></div>
                <button onClick={() => { setVersionDraft(versionTag); setEditingVersion(true); }} className="ml-3 text-xs text-zinc-400 border border-white/5 px-2 py-1 rounded">Edit</button>
              </>
            )}
         </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR: Full Height, No "Card" Look */}
        <aside className="w-[400px] flex flex-col border-r border-white/5 bg-[#050505]">
           {/* Search */}
           <div className="p-4 border-b border-white/5 space-y-3">
              <div className="relative">
                 <Search size={14} className="absolute left-3 top-2.5 text-zinc-600"/>
                 <input 
                   className="w-full bg-[#0A0A0B] border border-white/5 rounded-lg py-2 pl-9 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 transition-colors placeholder:text-zinc-700"
                   placeholder="Search commits..."
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
              </div>
              <div className="flex gap-2">
                {["ALL", "FEAT", "FIX"].map(tab => (
                   <button key={tab} onClick={() => setActiveTab(tab as any)} className={`text-[10px] font-medium px-2 py-1 rounded transition-colors ${activeTab === tab ? 'text-zinc-200 bg-white/5' : 'text-zinc-600 hover:text-zinc-400'}`}>{tab}</button>
                ))}
              </div>
           </div>

           {/* Minimalist Commit List */}
           <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredCommits.map(c => {
                const isSelected = selected.has(c.hash);
                return (
                  <div key={c.hash} onClick={() => toggleCommit(c.hash)} 
                    className={`px-5 py-4 border-b border-white/[0.02] cursor-pointer transition-colors hover:bg-white/[0.02] ${isSelected ? 'bg-white/[0.04]' : ''}`}
                  >
                     <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{c.type}</span>
                        <span className="text-[10px] text-zinc-700 font-mono">{c.hash.substring(0,6)}</span>
                     </div>
                     <p className={`text-xs leading-relaxed ${isSelected ? 'text-zinc-200' : 'text-zinc-500'}`}>{c.message}</p>
                  </div>
                )
              })}
           </div>
        </aside>

        {/* EDITOR AREA */}
        <main className="flex-1 flex flex-col bg-[#050505] relative">
           {/* Toolbar */}
           <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-[#050505]">
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">release_notes.md</span>
              <div className="flex items-center gap-2">
                 <button onClick={handleGenerate} className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-white/5"><RotateCcw size={12}/> Regen</button>
                 <button onClick={handlePublish} className="flex items-center gap-2 text-xs font-bold text-[#FF4F4F] hover:text-red-400 transition-colors px-3 py-1.5 rounded hover:bg-[#FF4F4F]/10"><Rocket size={12}/> Publish</button>
              </div>
           </div>

           {/* Editor Canvas */}
           <div className="flex-1 overflow-hidden relative">
              {generated ? (
                 <div className="h-full flex flex-col px-12 pt-12">
                    <h1 className="text-4xl font-bold text-zinc-100 mb-6">Release Notes <span className="text-zinc-600">{versionTag}</span></h1>
                    <div className="flex-1 pb-20">
                       <Editor 
                         ref={editorRef}
                         initialMarkdown={generated} 
                         onChange={setGenerated} 
                         editable={viewMode === 'edit'}
                       />
                    </div>
                 </div>
              ) : (
                 <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-sm font-mono">Select commits to start</div>
              )}
           </div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="h-9 border-t border-white/5 bg-[#050505] flex items-center justify-between px-6 shrink-0 z-20">
         <div className="flex items-center gap-5 text-[10px] text-zinc-600 font-mono">
           <span className="flex items-center gap-1.5"><kbd className="bg-white/5 border border-white/10 px-1.5 rounded text-zinc-500 min-w-[20px] text-center">J</kbd> <kbd className="bg-white/5 border border-white/10 px-1.5 rounded text-zinc-500 min-w-[20px] text-center">K</kbd> Navigate</span>
           <span className="flex items-center gap-1.5"><kbd className="bg-white/5 border border-white/10 px-1.5 rounded text-zinc-500">SPACE</kbd> Select</span>
         </div>
         <div className="flex items-center gap-4 text-[10px] text-zinc-600 font-mono">
           <span className="flex items-center gap-1.5"><kbd className="bg-white/5 border border-white/10 px-1.5 rounded text-zinc-500">CMD</kbd> + <kbd className="bg-white/5 border border-white/10 px-1.5 rounded text-zinc-500">ENTER</kbd> Generate</span>
           <span className="flex items-center gap-2 text-zinc-700 ml-4 opacity-50"><Sparkles size={10} className="text-[#FF4F4F]"/> Powered by Gemini 1.5</span>
         </div>
      </footer>
    </div>
  );
}
