"use client";

import React from "react";

interface TextSkeletonProps {
  lines?: number;
}

export default function TextSkeleton({ lines = 8 }: TextSkeletonProps) {
  const widths = [100, 90, 95, 80, 70, 60, 85, 92];
  return (
    <div className="w-full space-y-3">
      {/* title skeleton */}
      <div className="h-8 w-1/3 bg-white/6 rounded animate-pulse" />
      <div className="pt-4 space-y-2">
        {/* paragraph lines */}
        {Array.from({ length: Math.max(3, Math.floor(lines / 3)) }).map((_, i) => (
          <div key={`p-${i}`} className="space-y-2">
            <div className="h-4 bg-white/5 rounded-md animate-pulse" style={{ width: `${widths[(i * 2) % widths.length]}%` }} />
            <div className="h-4 bg-white/5 rounded-md animate-pulse" style={{ width: `${widths[(i * 2 + 1) % widths.length]}%` }} />
          </div>
        ))}

        {/* list placeholder */}
        <div className="pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`li-${i}`} className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white/6 rounded-full animate-pulse" />
              <div className="h-3 bg-white/5 rounded-md animate-pulse" style={{ width: `${60 - i * 8}%` }} />
            </div>
          ))}
        </div>

        {/* code block placeholder */}
        <div className="mt-3 h-20 bg-white/4 rounded animate-pulse" />
      </div>
    </div>
  );
}
