"use client";

import React, { useEffect, useState } from "react";

interface ScrollHintProps {
  targetId?: string;
  threshold?: number;
}

export default function ScrollHint({ targetId = "content", threshold = 8 }: ScrollHintProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;

    const check = () => {
      // show hint only when scrolled near top
      setVisible(el.scrollTop <= threshold);
    };

    const onPointer = () => setVisible(false);

    check();
    el.addEventListener("scroll", check, { passive: true });
    el.addEventListener("pointerdown", onPointer);
    el.addEventListener("touchstart", onPointer, { passive: true });

    return () => {
      el.removeEventListener("scroll", check);
      el.removeEventListener("pointerdown", onPointer);
      el.removeEventListener("touchstart", onPointer as any);
    };
  }, [targetId, threshold]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute left-0 right-0 bottom-0 h-12 flex items-end justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="w-full h-12 bg-gradient-to-t from-black/70 via-black/30 to-transparent rounded-b-lg" />
    </div>
  );
}
