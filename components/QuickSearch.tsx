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
  // results now include match indices for fuzzy highlighting
  const [results, setResults] = useState<Array<{ r: RepoShort; nameMatches: number[]; descMatches?: number[] }>>([]);
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
        const sel = results[active]?.r;
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

  // simple fuzzy matcher that finds characters of pattern in order inside text
  function fuzzyMatch(text: string, pattern: string) {
    const t = text.toLowerCase();
    const p = pattern.toLowerCase();
    const indices: number[] = [];
    let ti = 0;
    for (let pi = 0; pi < p.length; pi++) {
      const ch = p[pi];
      let found = false;
      while (ti < t.length) {
        if (t[ti] === ch) {
          indices.push(ti);
          ti++;
          found = true;
          break;
        }
        ti++;
      }
      if (!found) return null;
    }
    // score: earlier start is better, denser match (short span) is better, exact substring boosts
    const start = indices[0] ?? 0;
    const end = indices[indices.length - 1] ?? 0;
    const span = end - start + 1;
    let score = 100 - start; // earlier is better
    score += Math.max(0, 50 - span); // denser is better
    // substring boost
    if (t.includes(p)) score += 80;
    return { indices, score };
  }

  function performSearch(q: string) {
    if (!q) {
      setResults([]);
      setActive(0);
      return;
    }

    const needle = q.trim();
    if (!needle) {
      setResults([]);
      setActive(0);
      return;
    }

    const scored: Array<{ r: RepoShort; score: number; nameMatches: number[]; descMatches?: number[]; updated: number }> = [];

    for (const r of initialRepos) {
      const name = r.name || '';
      const desc = r.description || '';
      let totalScore = 0;
      let nameMatches: number[] = [];
      let descMatches: number[] | undefined = undefined;

      const mName = fuzzyMatch(name, needle);
      if (mName) {
        totalScore += mName.score + 100; // prefer name matches
        nameMatches = mName.indices;
      }
      const mDesc = fuzzyMatch(desc, needle);
      if (mDesc) {
        totalScore += mDesc.score;
        descMatches = mDesc.indices;
      }

      // if neither matched, skip
      if (!nameMatches.length && !descMatches?.length) continue;

      const updated = r.updated_at ? Date.parse(r.updated_at) : 0;
      scored.push({ r, score: totalScore, nameMatches, descMatches, updated });
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.updated || 0) - (a.updated || 0);
    });

    setResults(scored.slice(0, 8).map((s) => ({ r: s.r, nameMatches: s.nameMatches, descMatches: s.descMatches })));
    setActive(0);
    setVisible(true);
  }

  function renderHighlighted(text: string, indices?: number[]) {
    if (!text) return <>{text}</>;
    if (!indices || indices.length === 0) return <>{text}</>;
    const parts: Array<{ str: string; match: boolean }> = [];
    const set = new Set(indices);
    for (let i = 0; i < text.length; i++) {
      const isMatch = set.has(i);
      if (i === 0) {
        parts.push({ str: text[0], match: isMatch });
        continue;
      }
      const prevMatch = set.has(i - 1);
      if (isMatch === prevMatch) {
        parts[parts.length - 1].str += text[i];
      } else {
        parts.push({ str: text[i], match: isMatch });
      }
    }
    return (
      <>
        {parts.map((p, idx) => (
          <span key={idx} className={p.match ? 'text-amber-300 font-semibold' : ''}>
            {p.str}
          </span>
        ))}
      </>
    );
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
    // Render absolutely positioned overlay inside the search island container
    // so it overlaps content instead of pushing it down.
    return (
      <div className={`absolute left-0 right-0 mt-2 z-50 pointer-events-auto transition-opacity ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {visible && results.length > 0 && (
          <div className="max-h-96 overflow-auto bg-[#0A0A0B] border border-white/6 rounded-md shadow-lg py-1">
            <ul role="listbox" className="outline-none">
              {results.map((item, i) => (
                <li
                  key={item.r.id}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => (window.location.href = `/generate/${item.r.full_name}`)}
                  className={`px-3 py-2 cursor-pointer ${i === active ? 'bg-white/6' : 'hover:bg-white/3'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-zinc-100 truncate max-w-[300px]">{renderHighlighted(item.r.name || '', item.nameMatches)}</div>
                    <div className="text-xs text-zinc-500">{(item.r.full_name || '').split('/')[0]}</div>
                  </div>
                  {item.r.description && <div className="text-[12px] text-zinc-500 truncate mt-1">{renderHighlighted(item.r.description || '', item.descMatches)}</div>}
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
            {results.map((item, i) => (
              <li
                key={item.r.id}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => (window.location.href = `/generate/${item.r.full_name}`)}
                className={`px-3 py-2 cursor-pointer ${i === active ? 'bg-white/6' : 'hover:bg-white/3'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-zinc-100 truncate max-w-[300px]">{renderHighlighted(item.r.name || '', item.nameMatches)}</div>
                  <div className="text-xs text-zinc-500">{(item.r.full_name || '').split('/')[0]}</div>
                </div>
                {item.r.description && <div className="text-[12px] text-zinc-500 truncate mt-1">{renderHighlighted(item.r.description || '', item.descMatches)}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
