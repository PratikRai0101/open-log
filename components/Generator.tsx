"use client";

import { useState } from "react";
import { createChangelog } from "@/app/actions";
import { AIModel } from "@/lib/ai";
import { Loader2, Sparkles, Brain } from "lucide-react";
import ModelSelector from "@/components/ModelSelector";

export default function Generator({ repoName }: { repoName: string }) {
  const [model, setModel] = useState<AIModel>("llama-3.3-70b-versatile");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    const res = await createChangelog(repoName, model as AIModel);
    if (res.success && res.data) {
      setResult(res.data);
    } else {
      alert(res.error || "Generation failed");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex gap-2">
        {/* Model Selector */}
        <div className="w-72">
          <ModelSelector value={model} onChange={(v: string) => setModel(v as AIModel)} />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {/* Result Preview */}
      {result && (
        <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 whitespace-pre-wrap font-mono text-sm text-gray-300">
          {result}
        </div>
      )}
    </div>
  );
}
