"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface ModelOption {
  id: string;
  name: string;
  badge: string;
  icon: React.ReactNode;
  iconUrl?: string;
}

const MODELS: ModelOption[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "Streaming",
    iconUrl: "/icons/google-gemini.svg",
    icon: (
      // Star-like Gemini glyph
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M12 2l2.2 4.6L19 8l-4.6 2.2L12 15l-2.4-4.8L5 8l4.8-1.4L12 2z" fill="url(#g)" />
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Groq (Llama 3.3)",
    badge: "Fast",
    iconUrl: "/icons/grok-dark.svg",
    icon: (
      // Lightning / G glyph
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M13 2L3 14h7l-1 8L21 10h-7l-1-8z" fill="#F59E0B" />
      </svg>
    ),
  },
  {
    id: "kimi-k2-turbo-preview",
    name: "Kimi2 (Moonshot)",
    badge: "High Quality",
    iconUrl: "/icons/kimi-ai.svg",
    icon: (
      // Crescent glyph
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" fill="#60A5FA" />
      </svg>
    ),
  },
];

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  // renderMenu lets us keep the menu in the DOM while running a close animation
  const [renderMenu, setRenderMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [failedIcons, setFailedIcons] = useState<Record<string, boolean>>({});

  const selectedModel = MODELS.find((m) => m.id === value) || MODELS[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // trigger closing animation
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keep the menu rendered briefly so closing animation can run
  useEffect(() => {
    if (isOpen) {
      setRenderMenu(true);
    } else {
      // allow animation to finish before removing from DOM
      const t = setTimeout(() => setRenderMenu(false), 220);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block w-56" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 bg-[#0A0A0B] border border-white/5 rounded px-3 py-1 text-xs text-zinc-300"
        aria-haspopup
        aria-expanded={isOpen}
      >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 flex items-center justify-center">
              {selectedModel.iconUrl && !failedIcons[selectedModel.id] ? (
                <img
                  src={selectedModel.iconUrl}
                  alt={selectedModel.name}
                  className="w-6 h-6 object-cover rounded-full ring-1 ring-white/6 shadow-sm"
                  onError={() => setFailedIcons((s) => ({ ...s, [selectedModel.id]: true }))}
                />
              ) : (
                <div className="w-6 h-6 flex items-center justify-center rounded-full ring-1 ring-white/6 shadow-sm overflow-hidden">
                  {selectedModel.icon}
                </div>
              )}
            </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-medium text-zinc-200 truncate">{selectedModel.name}</span>
            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wide">{selectedModel.badge}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 text-[11px]">{selectedModel.id}</span>
          <ChevronDown size={14} className="text-zinc-500" />
        </div>
      </button>

      {/* Dropdown Menu */}
      {renderMenu && (
        <div
          className={`absolute top-full left-0 w-full mt-2 bg-[#121214] border border-white/10 rounded-lg shadow-xl shadow-black overflow-hidden z-50 transform transition-all duration-200 ease-out 
            ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-1 scale-95 pointer-events-none'}`}
        >
          {MODELS.map((model) => (
          <button
            key={model.id}
            onClick={() => {
              onChange(model.id);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors text-left ${value === model.id ? "bg-white/5" : ""}`}
          >
            <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                   {model.iconUrl && !failedIcons[model.id] ? (
                     <img
                       src={model.iconUrl}
                       alt={model.name}
                       className="w-6 h-6 object-cover rounded-full ring-1 ring-white/6 shadow-sm"
                       onError={() => setFailedIcons((s) => ({ ...s, [model.id]: true }))}
                       loading="lazy"
                     />
                   ) : (
                     <div className="w-6 h-6 flex items-center justify-center rounded-full ring-1 ring-white/6 shadow-sm overflow-hidden">{model.icon}</div>
                   )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-200">{model.name}</span>
                  <span className="text-[9px] text-zinc-500 font-mono tracking-wide uppercase">{model.badge}</span>
                </div>
              </div>
              {value === model.id && <Check size={14} className="text-zinc-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
