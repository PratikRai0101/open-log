"use client";

import React, { useState, useRef, useEffect } from "react";
import TextSkeleton from "@/components/TextSkeleton";
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
  ArrowLeft,
  PenLine,
  Eye,
  Lock,
  Rocket,
  Search,
  User,
  Calendar,
} from "lucide-react";
// Clerk UserButton for real profile avatar
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { publishRelease, getLatestReleaseTag } from "@/app/actions";
import ModelSelector from "@/components/ModelSelector";

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
  // flusher used by streaming typewriter logic; declared here so finally blocks can access it
  let flusher: number | null = null;
  const [showPolishedBadge, setShowPolishedBadge] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [savedDraft, setSavedDraft] = useState<string | null>(null);
  const [showRestoreDraftPrompt, setShowRestoreDraftPrompt] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("preview"); // New: Tabs
  const [versionTag, setVersionTag] = useState("v1.0.0"); // New: Input field
  const [latestTag, setLatestTag] = useState<string | null>(null);
  const [bumps, setBumps] = useState<{ patch: string; minor: string; major: string } | null>(null);
  const editorRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [copied, setCopied] = useState(false);
  // versionTag is editable inline
  // model selector: 'gemini' uses Google Generative AI streaming path
  const [selectedModel, setSelectedModel] = useState<"gemma-27b-it" | "llama-3.3-70b-versatile" | "moonshot-v1-8k">("gemma-27b-it");

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
      const key = `openlog_draft_${repoName}`;
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(key);
        if (saved) {
          // Do not auto-restore silently. Offer the user a non-destructive
          // Restore Draft prompt so they can accept or discard the autosaved
          // content. We still show that a draft exists and when it was saved.
          setSavedDraft(saved);
          setShowRestoreDraftPrompt(true);
          setLastSavedAt(Date.now());
        }
      }
    } catch (e) {
      // noop
    }
    // Fetch latest release tag and compute bumps
    (async () => {
      try {
        const tag = await getLatestReleaseTag(repoName);
        if (tag) {
          setLatestTag(tag);
          const match = tag.match(/v?(\d+)\.(\d+)\.(\d+)/);
          if (match) {
            const major = parseInt(match[1]);
            const minor = parseInt(match[2]);
            const patch = parseInt(match[3]);
            setBumps({
              patch: `v${major}.${minor}.${patch + 1}`,
              minor: `v${major}.${minor + 1}.0`,
              major: `v${major + 1}.0.0`,
            });
            setVersionTag(`v${major}.${minor}.${patch + 1}`);
          }
        }
      } catch (e) {
        // ignore
      }
    })();
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
        const key = `openlog_draft_${repoName}`;
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

  // Persist selected commits to localStorage so selection survives refresh/navigation
  useEffect(() => {
    try {
      const key = `openlog:selected:${repoName}`;
      const arr = Array.from(selected);
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(arr));
      }
    } catch (e) {
      // noop
    }
  }, [selected, repoName]);

  // Load persisted selection on mount
  useEffect(() => {
    try {
      const key = `openlog:selected:${repoName}`;
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as string[];
          if (Array.isArray(parsed)) {
            // ensure we only keep hashes that still exist in the commits list
            const valid = new Set(initialCommits.map(c => c.hash));
            const initial = new Set(parsed.filter(h => valid.has(h)));
            setSelected(initial);
          }
        }
      }
    } catch (e) {
      // noop
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        body: JSON.stringify({ repo: repoName, commits: selectedCommits, model: selectedModel }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream from server");

      const decoder = new TextDecoder();
      let partial = "";
      let expectFinalReplace = false;

      // Typewriter buffer/flusher for smooth streaming.
      // Different models get different pacing to avoid feeling laggy.
       let revealBuffer = "";
       let displayed = "";
       const isGemma = String(selectedModel || "").toLowerCase().includes("gem");
       // For Groq fallback (non-streaming model emulation) we want the flusher
       // to reveal characters more aggressively so the user sees progressive
       // typing. Keep smaller interval and higher reveal rate for gemma-like
       // models, otherwise use a moderate pacing that feels like typing.
       const flushInterval = isGemma ? 40 : 45; // ms between UI updates
       const charsPerTick = isGemma ? 6 : 12; // characters revealed per tick

       const startFlusher = () => {
         if (flusher) return;
         flusher = window.setInterval(() => {
           try {
             if (!revealBuffer) {
               // nothing to reveal; stop until new data arrives
               if (flusher) {
                 clearInterval(flusher as number);
                 flusher = null;
               }
               return;
             }

             // dynamic pacing: reveal more characters if buffer grows to avoid backlog
             const dynamicChars = isGemma
               ? Math.max(2, Math.min(12, Math.floor(revealBuffer.length / 6) + 1))
               : Math.max(4, Math.min(32, Math.floor(revealBuffer.length / 6) + charsPerTick));

             const take = revealBuffer.slice(0, dynamicChars);
             revealBuffer = revealBuffer.slice(take.length);
             displayed += take;

             // Batch UI updates to the next animation frame to reduce layout thrash
             requestAnimationFrame(() => replaceGenerated(displayed, false));
           } catch (e) {
             // ignore flusher errors
           }
         }, flushInterval) as unknown as number;
       };

      // show loading skeleton while receiving content
      setGenerated("");
      setIsGenerating(true);

       const replaceGenerated = (newText: string, polished = false) => {
        try {
          // preserve scroll position as ratio to avoid jump/flicker
           const el = previewRef.current || document.querySelector('.bn-view__content') as HTMLDivElement | null;
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
             const el2 = previewRef.current || document.querySelector('.bn-view__content') as HTMLDivElement | null;
             if (el2) {
               const { scrollHeight, clientHeight } = el2;
               el2.scrollTop = ratio * Math.max(1, (scrollHeight - clientHeight));
             }
           });
        } catch (e) {
          setGenerated(newText);
        }
      };

       // Streaming parser buffer to safely extract control JSON markers that may
       // be split across chunks. We accumulate into streamBuf and process any
       // control markers (~~JSON~~{...}) found inside it.
       let streamBuf = "";

       while (true) {
         const { done, value } = await reader.read();
         if (done) break;
         const chunk = decoder.decode(value, { stream: true });
         streamBuf += chunk;

         // Process any control JSON markers embedded in the buffer. Markers are
         // expected in the form: ~~JSON~~{...}\n but may be split across chunks.
         while (true) {
           const idx = streamBuf.indexOf("~~JSON~~");
           if (idx === -1) break;

           // Any text before the marker is normal content -> reveal progressively
           if (idx > 0) {
             const textBefore = streamBuf.slice(0, idx);
             if (expectFinalReplace) {
               partial = textBefore;
               revealBuffer = "";
               displayed = partial;
               if (flusher) {
                 clearInterval(flusher as number);
                 flusher = null;
               }
               replaceGenerated(partial, true);
               expectFinalReplace = false;
             } else {
               revealBuffer += textBefore;
               startFlusher();
             }
           }

           // Try to extract the JSON block following the marker. Wait for a newline
           // that terminates the JSON payload; if not present yet, wait for more data.
           const rest = streamBuf.slice(idx + 8);
           const nl = rest.indexOf("\n");
           if (nl === -1) {
             // incomplete JSON payload — wait for next chunk
             break;
           }

           const jsonText = rest.slice(0, nl).trim();
           // Advance streamBuf past the processed marker+payload+newline
           streamBuf = rest.slice(nl + 1);

           try {
             if (jsonText) {
               const obj = JSON.parse(jsonText);
               if (obj.meta) setTotalChunks(obj.meta.totalChunks || 0);
               if (obj.chunkIndex !== undefined) setCurrentChunk(obj.chunkIndex);
               if (obj.chunkDone !== undefined) {
                 setCompletedChunks((prev) => Math.max(prev, obj.chunkDone + 1));
                 setCurrentChunk(null);
               }
               if (obj.final) {
                 // next non-control content should replace instead of append
                 expectFinalReplace = true;
               }
             }
           } catch (e) {
             // ignore malformed JSON — continue processing remaining buffer
           }
         }

         // After processing markers, whatever remains in streamBuf is normal text.
         if (streamBuf) {
           if (expectFinalReplace) {
             partial = streamBuf;
             revealBuffer = "";
             displayed = partial;
             if (flusher) {
               clearInterval(flusher as number);
               flusher = null;
             }
             replaceGenerated(partial, true);
             expectFinalReplace = false;
             streamBuf = "";
           } else {
             revealBuffer += streamBuf;
             startFlusher();
             streamBuf = "";
           }
         }
       }
    } catch (err) {
      console.error(err);
      setGenerated("## Error\nFailed to generate changelog.");
    } finally {
      // clear any running flusher
      try {
        if (flusher) clearInterval(flusher as number);
      } catch (e) {
        // noop
      }
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

  // versionTag is editable inline; no edit button necessary

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
        setCopied(true);
        toast.success("Copied release body to clipboard");
        setTimeout(() => setCopied(false), 1800);
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
      if (ok) {
        setCopied(true);
        toast.success("Copied release body to clipboard");
        setTimeout(() => setCopied(false), 1800);
      } else toast.error("Copy failed");
    } catch (e) {
      console.error(e);
      toast.error("Copy failed");
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#050505] text-zinc-300 font-sans overflow-hidden">
      {/* GLOBAL HEADER */}
      <header className="h-14 px-5 flex items-center justify-between border-b border-white/5 bg-[#050505] shrink-0 z-20 relative">
          <div className="flex items-center gap-3">
             <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors"><ArrowLeft size={16} /></Link>
             <span className="font-bold text-zinc-100 tracking-tight">OpenLog</span>
             <span className="text-zinc-700">/</span>
             <span className="text-sm text-zinc-400 font-mono truncate max-w-50">{repoName}</span>
          </div>
         
         <div className="flex bg-[#0A0A0B] p-1 rounded-lg border border-white/5">
            <button onClick={() => setViewMode("edit")} className={`px-4 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'edit' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Write</button>
            <button onClick={() => setViewMode("preview")} className={`px-4 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'preview' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Preview</button>
         </div>

          <div className="flex items-center gap-4">
            {/* Version Input & Smart SemVer Bumps */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/5 rounded focus-within:border-white/20 transition-colors">
                  <span className="text-[10px] text-zinc-500 font-mono">tag:</span>
                  <input 
                    type="text" 
                    value={versionTag}
                    onChange={(e) => setVersionTag(e.target.value)}
                    className="bg-transparent border-none text-[10px] font-mono text-zinc-300 w-20 focus:ring-0 p-0 placeholder-zinc-600"
                    placeholder="v0.0.0"
                  />
              </div>
              
              {/* SemVer Bump Buttons */}
              {bumps && (
                <div className="flex items-center gap-1 bg-[#0A0A0B] p-0.5 rounded border border-white/5">
                  <button onClick={() => setVersionTag(bumps.patch)} className="text-[9px] font-mono px-1.5 py-0.5 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors" title={`Patch to ${bumps.patch}`}>Patch</button>
                  <button onClick={() => setVersionTag(bumps.minor)} className="text-[9px] font-mono px-1.5 py-0.5 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors" title={`Minor to ${bumps.minor}`}>Minor</button>
                  <button onClick={() => setVersionTag(bumps.major)} className="text-[9px] font-mono px-1.5 py-0.5 rounded text-[#FF4F4F] bg-[#FF4F4F]/10 hover:bg-[#FF4F4F]/20 transition-colors" title={`Major to ${bumps.major}`}>Major</button>
                </div>
              )}
            </div>

            {/* Restore Draft CTA (non-destructive) */}
            {showRestoreDraftPrompt && savedDraft && (
              <div className="ml-3 flex items-center gap-2 bg-[#071012] px-2 py-1 rounded border border-white/6">
                <div className="text-xs text-zinc-400 font-mono">Draft found</div>
                <button
                  onClick={() => {
                    setGenerated(savedDraft);
                    setShowRestoreDraftPrompt(false);
                    // keep savedDraft in case user wants to discard later
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded text-zinc-300 hover:bg-white/5"
                >
                  Restore
                </button>
                <button
                  onClick={() => {
                    try {
                      const key = `openlog_draft_${repoName}`;
                      if (typeof window !== "undefined") localStorage.removeItem(key);
                    } catch (e) {
                      // noop
                    }
                    setSavedDraft(null);
                    setShowRestoreDraftPrompt(false);
                  }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded text-zinc-500 hover:text-zinc-300"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* User Button */}
            <UserButton
              afterSignOutUrl="/"
              appearance={{ elements: { avatarBox: "size-8 border border-white/10" } }}
            />
         </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* SIDEBAR: Full Height, No "Card" Look */}
         <aside className="w-90 flex flex-col border-r border-white/5 bg-[#050505] shrink-0">
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
             <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
               {/* Selection header with count */}
               <div className="px-5 py-3 border-b border-white/6 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Select Commits</span>
                   <span className="text-[11px] text-zinc-300 bg-white/3 px-2 py-0.5 rounded text-xs font-mono">{selected.size} selected</span>
                 </div>
                 <div>
                   <button onClick={toggleAll} className="text-[10px] text-zinc-400 bg-transparent border border-white/6 px-2 py-1 rounded hover:bg-white/5">{selected.size === initialCommits.length ? 'Unselect All' : 'Select All'}</button>
                 </div>
               </div>

               {filteredCommits.map((c, idx) => {
                 const isSelected = selected.has(c.hash);
                 return (
                   <div key={c.hash} onClick={() => toggleCommit(c.hash)} 
                     className={`commit-item px-5 py-4 border-b border-white/2 cursor-pointer transition-colors hover:bg-white/2 flex items-start gap-3 ${isSelected ? 'bg-white/4' : ''} ${isSelected ? 'animate-selection' : ''}`}
                     style={{ animationDelay: `${Math.min(200, idx * 12)}ms` }}
                   >
                      {/* left accent */}
                      <div className={`w-1 rounded-r h-full mt-1 ${isSelected ? 'bg-rose-500' : 'bg-transparent'}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                           <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{c.type}</span>
                           <span className="text-[10px] text-zinc-700 font-mono">{c.hash.substring(0,6)}</span>
                        </div>
                        <p className={`text-xs leading-relaxed ${isSelected ? 'text-zinc-200' : 'text-zinc-500'}`}>{c.message}</p>
                      </div>
                      <div className="flex items-start pl-2">
                        {isSelected && <Check size={14} className="text-rose-400 mt-1" />}
                      </div>
                   </div>
                 )
               })}
            </div>
        </aside>

        {/* EDITOR AREA */}
         <main className="flex-1 flex flex-col bg-[#050505] relative min-w-0">
           {/* Toolbar */}
            <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-[#050505] shrink-0">
               <div className="flex items-center gap-2">
                  {/* Model selector dropdown (editor toolbar) */}
                  <ModelSelector
                    value={selectedModel}
                    onChange={(val) => setSelectedModel(val as any)}
                  />
                 <PenLine size={12} className="text-zinc-600"/>
                 <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">release_notes.md</span>
               </div>
               <div className="flex items-center gap-2">
                  {/* Copy Button */}
                  <button onClick={handleCopy} disabled={!generated} className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-white/5 disabled:opacity-50">
                     {copied ? <Check size={12} className="text-emerald-500"/> : <Copy size={12}/>} Copy
                  </button>

                  {/* Regenerate Button */}
                  <button onClick={handleGenerate} disabled={isGenerating || selected.size === 0} className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-white/5 disabled:opacity-50">
                     <RotateCcw size={12} className={isGenerating ? "animate-spin" : ""}/> Generate
                  </button>

                  {/* Publish Button (Red Brand Color) */}
                  <button onClick={handlePublish} disabled={isGenerating || !generated} className="flex items-center gap-2 text-xs font-bold text-white bg-[#FF4F4F] hover:bg-[#FF4F4F]/90 transition-all px-4 py-1.5 rounded shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:shadow-none ml-2">
                     <Rocket size={12}/> Publish
                  </button>
               </div>
            </div>

           {/* Editor Canvas */}
            <div className="flex-1 overflow-hidden relative">
                {isGenerating && !generated ? (
                   <div className="h-full flex flex-col px-12 pt-8 overflow-hidden">
                      <TextSkeleton lines={12} />
                   </div>
                ) : generated ? (
                  <div className="h-full flex flex-col px-12 pt-8 overflow-hidden">
                     {/* Document Title Header */}
                     <div className="shrink-0 mb-8 pb-4 border-b border-white/5">
                        <h1 className="text-3xl font-bold text-zinc-100 mb-2 tracking-tight">Release Notes <span className="text-[#FF4F4F]">{versionTag}</span></h1>
                        <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono">
                           <span className="flex items-center gap-1"><Calendar size={12}/> {new Date().toLocaleDateString()}</span>
                        </div>
                     </div>
                      {/* The Editor */}
                      <div className="flex-1 relative min-h-0 pb-10">
                         <div className="flex items-center justify-end px-4 mb-2">
                           <div className="text-[11px] text-zinc-500 mr-3">Draft saved:</div>
                           <div className="text-[11px] text-zinc-400 font-mono">{lastSavedAt ? formatAgo(lastSavedAt) : (savedDraft ? 'just now' : 'never')}</div>
                         </div>
                         <Editor 
                           ref={editorRef}
                           initialMarkdown={generated} 
                           onChange={setGenerated} 
                           editable={viewMode === 'edit'}
                         />
                      </div>
                  </div>
               ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 select-none opacity-50">
                     <Sparkles size={48} className="mb-4 text-zinc-800"/>
                     <p className="text-sm font-mono uppercase tracking-widest">Select commits to generate</p>
                  </div>
               )}
            </div>
        </main>
      </div>
      {/* FOOTER REMOVED */}
    </div>
  );
}
