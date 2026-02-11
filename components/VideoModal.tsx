"use client";

import React, { useEffect } from "react";

type Source = { src: string; type: string };

type Props = {
  open: boolean;
  onClose: () => void;
  sources: Source[];
  poster?: string;
  title?: string;
};

export default function VideoModal({ open, onClose, sources, poster, title = "Demo video" }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-4xl">
        <button
          aria-label="Close video"
          onClick={onClose}
          className="absolute -top-3 -right-3 rounded-full bg-black/70 p-2 text-white z-50 border border-white/10"
        >
          ✕
        </button>

        <video
          className="w-full rounded-lg shadow-2xl bg-black"
          controls
          playsInline
          poster={poster}
          preload="metadata"
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
          Your browser does not support the video tag.
        </video>

        {title && <div className="mt-3 text-sm text-zinc-300 text-center">{title}</div>}
      </div>
    </div>
  );
}
