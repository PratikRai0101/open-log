"use client";

import React, { useEffect, useRef, useState } from "react";

export default function QuickSearch() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      const mod = ev.ctrlKey || ev.metaKey;
      if (mod && (ev.key === 'k' || ev.key === 'K')) {
        ev.preventDefault();
        setVisible(true);
        // focus the search input in the DOM
        const el = document.getElementById('repo-search') as HTMLInputElement | null;
        if (el) {
          el.focus();
          el.select();
        }
      }
      // Escape to dismiss
      if (ev.key === 'Escape') {
        setVisible(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // lightweight visual indicator only — the actual input lives in page.tsx
  return (
    <div aria-hidden className={`fixed left-6 top-22 z-40 transition-opacity ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-white/3 text-zinc-200 px-3 py-2 rounded-md text-sm shadow">Press ⌘K to focus search</div>
    </div>
  );
}
