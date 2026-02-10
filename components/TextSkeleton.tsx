"use client";

import React from "react";

interface TextSkeletonProps {
  lines?: number;
}

export default function TextSkeleton({ lines = 8 }: TextSkeletonProps) {
  const widths = [100, 90, 95, 80, 70, 60, 85, 92];

  return (
    <div className="w-full space-y-4">
      {/* Title */}
      <div className="h-9 w-1/3 bg-white/6 rounded animate-pulse" />

      {/* Meta row (date / tag) */}
      <div className="flex items-center gap-3">
        <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
        <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
      </div>

      {/* Paragraph lines */}
      <div className="pt-2 space-y-2">
        {Array.from({ length: Math.max(3, Math.min(lines, 6)) }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-white/5 rounded-md animate-pulse"
            style={{ width: `${widths[i % widths.length]}%` }}
          />
        ))}
      </div>

      {/* Bullet list placeholder */}
      <div className="pt-2 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`li-${i}`} className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-white/6 mt-2 animate-pulse" />
            <div className="h-3 bg-white/5 rounded-md w-3/4 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Code block placeholder */}
      <div className="mt-3 bg-white/3 rounded-lg p-3">
        <div className="h-3 bg-white/6 rounded mb-2 animate-pulse" style={{ width: '40%' }} />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`code-${i}`} className="h-3 bg-white/6 rounded animate-pulse" style={{ width: `${80 - i * 10}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
