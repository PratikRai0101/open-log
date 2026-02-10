"use client";

import React, { useEffect, useRef, useState } from "react";

interface RepoShort {
  id: number;
  name: string;
  full_name: string;
  description?: string | null;
  updated_at?: string;
}

interface QuickSearchProps {
  initialRepos?: RepoShort[];
  inline?: boolean; // render dropdown inside the search island when true
}

export default function QuickSearch({ initialRepos = [], inline = false }: QuickSearchProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RepoShort[]>([]);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

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
          if (!inline) {
            const r = el.getBoundingClientRect();
            setPos({ left: r.left, top: r.bottom + 8, width: r.width });
          }
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

  // wire the input events from the DOM input into this client component
  useEffect(() => {
    const el = document.getElementById('repo-search') as HTMLInputElement | null;
    if (!el) return;

    inputRef.current = el;

    let timeout: number | null = null;
    const onInput = () => {
      const v = el.value || '';
      setQuery(v);
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        performSearch(v || '');
      }, 150) as unknown as number;
    };

    const onKey = (ev: KeyboardEvent) => {
      if (!visible) return;
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        setActive((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      } else if (ev.key === 'Enter') {
        ev.preventDefault();
        const sel = results[active];
        if (sel) window.location.href = `/generate/${sel.full_name}`;
      }
    };

    el.addEventListener('input', onInput, { passive: true });
    window.addEventListener('keydown', onKey);

    const onResize = () => {
      const r = el.getBoundingClientRect();
      setPos({ left: r.left, top: r.bottom + 8, width: r.width });
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);

    return () => {
      el.removeEventListener('input', onInput as any);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
      if (timeout) window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, results, active]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setActive(0);
      return;
    }
    performSearch(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function performSearch(q: string) {
    if (!q) {
      setResults([]);
      setActive(0);
      return;
    }
    const needle = q.trim().toLowerCase();
    const scored = initialRepos.map((r) => {
      const name = (r.name || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();
      let score = 0;
      if (name === needle) score += 100;
      else if (name.startsWith(needle)) score += 70;
      else if (name.includes(needle)) score += 40;
      if (desc.startsWith(needle)) score += 30;
      else if (desc.includes(needle)) score += 10;
      // recency boost
      const updated = r.updated_at ? Date.parse(r.updated_at) : 0;
      return { r, score, updated };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.updated || 0) - (a.updated || 0);
    });

    setResults(scored.slice(0, 8).map((s) => s.r));
    setActive(0);
    setVisible(true);
  }

  // click outside to dismiss
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = document.getElementById('repo-search');
      const target = e.target as Node | null;
      if (!el) return;
      if (target && el.contains(target)) return;
      setVisible(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  if (inline) {
    return (
      <div className={`relative transition-opacity ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {visible && results.length > 0 && (
          <div className="mt-4 max-h-96 overflow-auto bg-[#0A0A0B] border border-white/6 rounded-md shadow-lg py-1">
            <ul role="listbox" className="outline-none">
              {results.map((r, i) => (
                <li
                  key={r.id}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => (window.location.href = `/generate/${r.full_name}`)}
                  className={`px-3 py-2 cursor-pointer ${i === active ? 'bg-white/6' : 'hover:bg-white/3'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-zinc-100 truncate max-w-[300px]">{r.name}</div>
                    <div className="text-xs text-zinc-500">{r.full_name.split('/')[0]}</div>
                  </div>
                  {r.description && <div className="text-[12px] text-zinc-500 truncate mt-1">{r.description}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div aria-hidden={false} className={`fixed z-40 transition-opacity ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ left: pos?.left ?? 24, top: pos?.top ?? 120 }}>
      <div className="bg-white/3 text-zinc-200 px-3 py-2 rounded-md text-sm shadow">Press ⌘K to focus search</div>
      {visible && results.length > 0 && (
        <div className="mt-2 max-h-96 overflow-auto bg-[#0A0A0B] border border-white/6 rounded-md shadow-lg py-1" style={{ width: pos?.width ?? 420 }}>
          <ul role="listbox" className="outline-none">
            {results.map((r, i) => (
              <li
                key={r.id}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => (window.location.href = `/generate/${r.full_name}`)}
                className={`px-3 py-2 cursor-pointer ${i === active ? 'bg-white/6' : 'hover:bg-white/3'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-zinc-100 truncate max-w-[300px]">{r.name}</div>
                  <div className="text-xs text-zinc-500">{r.full_name.split('/')[0]}</div>
                </div>
                {r.description && <div className="text-[12px] text-zinc-500 truncate mt-1">{r.description}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
