"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Check, 
  ArrowRight, 
  GitCommit, 
  Sparkles, 
  Copy, 
  RotateCcw, 
  FileText,
  ChevronLeft
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
  initialCommits?: SimpleCommit[];
  repo: string;
}

export default function WorkstationClient({ initialCommits = [], repo }: WorkstationProps) {
  // State for commits, selection and generation
  const [commits, setCommits] = useState<SimpleCommit[]>(initialCommits);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generated, setGenerated] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [totalChunksState, setTotalChunksState] = useState<number>(0);
  const [currentChunkState, setCurrentChunkState] = useState<number | null>(null);
  const [completedChunksState, setCompletedChunksState] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch commits from API when component mounts or repo changes
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!repo) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/commits?repo=${encodeURIComponent(repo)}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!mounted) return;
        // data may be an object { error } or an array
        if (Array.isArray(data)) setCommits(data as SimpleCommit[]);
        else setCommits([]);
      } catch (err) {
        console.error("Failed to load commits:", err);
        if (mounted) setCommits([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [repo]);

  // Toggle selection logic
  function toggleCommit(hash: string) {
    const next = new Set(selected);
    if (next.has(hash)) {
      next.delete(hash);
    } else {
      next.add(hash);
    }
    setSelected(next);
  }

  // Select All / Deselect All
  function toggleAll() {
    if (selected.size === commits.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(commits.map((c) => c.hash)));
    }
  }

  // The "Brain" - Calls the AI Server Action
  async function handleGenerate() {
    if (selected.size === 0) return;
    
    setIsGenerating(true);
    setGenerated(""); // Clear previous
    // Prepare to stream partial output
    let partial = "";

      try {
        setGenerationError(null);
        // Filter the actual commit objects based on selected hashes
        const selectedCommits = commits.filter((c) => selected.has(c.hash));

      // Create an AbortController so the user can cancel the request
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, commits: selectedCommits }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(await res.text());

       // Stream response body incrementally
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream from server");

      const decoder = new TextDecoder();
      // Read the stream iteratively; handle embedded JSON control lines for progress.
      // track progress based on chunks
      let totalChunks = 0;
      let completedChunks = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // The server prefixes progress/control JSON lines with a marker `~~JSON~~`.
        if (chunk.startsWith("~~JSON~~")) {
          // Might contain multiple lines; process each
          const lines = chunk.split(/\n+/).filter(Boolean);
          for (const ln of lines) {
            if (!ln.startsWith("~~JSON~~")) continue;
            try {
              const obj = JSON.parse(ln.replace(/^~~JSON~~/, ""));
              if (obj.meta) {
                totalChunks = obj.meta.totalChunks || totalChunks;
                setTotalChunksState(totalChunks);
              }
              if (obj.chunkIndex !== undefined) {
                // server announced this chunk will stream next
                setCurrentChunkState(obj.chunkIndex);
              }
              if (obj.chunkDone !== undefined) {
                completedChunks = Math.max(completedChunks, obj.chunkDone + 1);
                setCompletedChunksState(completedChunks);
                // clear current chunk
                setCurrentChunkState(null);
              }
            } catch (e) {
              // ignore malformed control JSON
            }
          }
          continue;
        }

        // Normal content - append immediately for live streaming
        partial += chunk;
        setGenerated(partial);
      }
      // Mark generation as complete (stream finished normally)
      setIsComplete(true);
      // Clear controller after successful finish
      abortControllerRef.current = null;
    } catch (err) {
      // If aborted by user, show a short notice but keep partial content
      if ((err as any)?.name === "AbortError") {
        console.log("Generation aborted by user");
        // aborted means not complete
        setIsComplete(false);
      } else {
        console.error(err);
        const message = (err as any)?.message || "Failed to generate changelog. Please check console.";
        setGenerationError(message);
        // keep any partial content but surface the error to the user
        if (!partial) setGenerated("## Error\n" + message);
        setIsComplete(false);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function handlePublish() {
    if (!generated) return;

    const tag = window.prompt("Enter a version tag for this release (e.g., v1.0.0):", "v1.0.0");
    if (!tag) return; // cancelled

    setIsGenerating(true);
    try {
      const title = generated.split("\n")[0].replace(/^#\s*/, "") || "New Release";
      // Server action call
      const result = await publishRelease(repo, tag, title, generated);
      if (result && (result as any).success) {
        const url = (result as any).url;
        if (confirm("Release published! View on GitHub?")) {
          window.open(url, "_blank");
        }
      } else {
        alert("Error: " + ((result as any).error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong while publishing the release.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCancel() {
    const controller = abortControllerRef.current;
    if (controller) {
      controller.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      setIsComplete(false);
    }
  }

  return (
    <div className="h-screen flex bg-[#050505] text-zinc-300 overflow-hidden font-sans selection:bg-[#FF4F4F] selection:text-white">
      
      {/* LEFT PANEL: Commit Selection */}
      <aside className="w-100 shrink-0 h-full flex flex-col border-r border-white/5 bg-[#0A0A0B]">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0A0A0B]">
          <div className="flex items-center gap-3 overflow-hidden">
            <Link href="/" className="p-1.5 rounded-md hover:bg-white/5 text-zinc-500 hover:text-white transition-colors">
              <ChevronLeft size={16} />
            </Link>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-zinc-100 truncate text-sm">{repo}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Select Commits</span>
            </div>
          </div>
          <div className="text-xs text-zinc-500 font-mono">
            {selected.size} / {commits.length}
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-white/5 bg-[#050505]/50 flex justify-between items-center">
          <button 
            onClick={toggleAll}
            className="text-[11px] font-medium text-zinc-500 hover:text-white transition-colors uppercase tracking-wide"
          >
            {selected.size === commits.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        {/* Commit List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {loading ? (
            <div className="p-4 text-zinc-500 text-sm">Loading commits…</div>
          ) : commits.length === 0 ? (
            <div className="p-4 text-zinc-500 text-sm">No commits found for this repository.</div>
          ) : (
            <>
              {commits.map((c) => {
                const isSelected = selected.has(c.hash);
                return (
                  <div
                    key={c.hash}
                    onClick={() => toggleCommit(c.hash)}
                    className={`group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-[#FF4F4F]/5 border-[#FF4F4F]/20"
                        : "bg-transparent border-transparent hover:bg-white/3"
                    }`}
                  >
                    {/* Checkbox */}
                    <div className={`mt-0.5 size-4 rounded border flex items-center justify-center transition-colors ${
                      isSelected ? "bg-[#FF4F4F] border-[#FF4F4F]" : "border-white/10 group-hover:border-white/30"
                    }`}>
                      {isSelected && <Check size={12} className="text-white stroke-3" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          c.type === 'feat' ? 'bg-emerald-500/10 text-emerald-500' :
                          c.type === 'fix' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-zinc-500/10 text-zinc-500'
                        }`}>
                          {c.type}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-mono">{c.hash.substring(0,6)}</span>
                      </div>
                      <p className={`text-sm leading-tight truncate ${isSelected ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-300"}`}>
                        {c.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-600">
                        <span className="flex items-center gap-1"><GitCommit size={10}/> {c.author_name}</span>
                        <span>•</span>
                        <span>{c.date}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </aside>

      {/* RIGHT PANEL: AI Editor */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-125 h-125 bg-[#FF4F4F]/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-2 text-zinc-400">
            <FileText size={16} />
            <span className="text-sm font-medium">Release Notes</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || selected.size === 0}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${selected.size === 0 
                ? "bg-white/5 text-zinc-600 cursor-not-allowed" 
                : "bg-[#FF4F4F] hover:bg-[#ff6666] text-white shadow-[0_0_20px_rgba(255,79,79,0.3)]"
              }
            `}
          >
            {isGenerating ? (
              <>
                <RotateCcw className="animate-spin" size={16} />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Changelog
              </>
            )}
          </button>
          {/* Publish button: only shown when we have generated content and not currently generating */}
          {generated && !isGenerating && (
            <button
              onClick={handlePublish}
              className="ml-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Publish
            </button>
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

        {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 relative z-10">
            {/* Top progress / error indicators */}
            <div className="max-w-3xl mx-auto mb-4">
              {isGenerating && (
                <div className="h-2 w-full bg-white/5 rounded overflow-hidden">
                  <div id="ol-progress" className="h-2 bg-[#FF4F4F] w-0 transition-width duration-300" />
                </div>
              )}
              {/* Small textual progress beneath the bar */}
              {isGenerating && totalChunksState > 0 && (
                <div className="mt-2 text-xs text-zinc-500 font-mono">
                  Chunk {Math.max(1, (currentChunkState ?? completedChunksState))} of {totalChunksState} — {completedChunksState} completed
                </div>
              )}
              {generationError && (
                <div className="mt-3 p-3 rounded-md bg-amber-900/60 text-amber-100 flex items-center justify-between">
                  <div className="text-sm">{generationError}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGenerate()}
                      className="px-3 py-1 rounded bg-amber-700/80 text-sm text-white"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
            </div>

            {generated ? (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#0A0A0B] border border-white/10 rounded-xl p-8 shadow-2xl relative">
                {/* Publish button moved to header for discoverability */}
                {/* Copy Button */}
                <button 
                  onClick={() => navigator.clipboard.writeText(generated)}
                  className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                  title="Copy to Clipboard"
                >
                  <Copy size={16} />
                </button>
                {/* Typing indicator for the active chunk */}
                {isGenerating && currentChunkState !== null && (
                  <div className="absolute left-4 top-4 flex items-center gap-2 text-sm text-zinc-400">
                    <RotateCcw className="animate-spin" size={14} />
                    <span>Processing chunk {currentChunkState + 1} of {totalChunksState}</span>
                  </div>
                )}

                {/* Markdown Renderer */}
                <div className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-100 prose-p:text-zinc-400 prose-li:text-zinc-300">
                  <ReactMarkdown>{generated}</ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            // Placeholder State
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <div className="size-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Sparkles size={32} className="text-zinc-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-200">Ready to Write</h3>
              <p className="text-sm text-zinc-500 max-w-xs mt-2">
                Select commits from the sidebar and click "Generate" to let AI draft your release notes.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
