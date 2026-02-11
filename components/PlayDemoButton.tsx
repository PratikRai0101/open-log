"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const VideoModal = dynamic(() => import("./VideoModal"), { ssr: false });

export default function PlayDemoButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 bg-transparent text-white hover:bg-white/5 transition"
      >
        <span className="w-4 h-4 rounded-full bg-white/90 text-black flex items-center justify-center">▶</span>
        <span>Play demo</span>
      </button>

      <VideoModal
        open={open}
        onClose={() => setOpen(false)}
        poster="/hero-screenshot.png"
        title="OpenLog demo"
        sources={[{ src: "/OpenLog-Demo.mp4", type: "video/mp4" }]}
      />
    </>
  );
}
