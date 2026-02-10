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
      <div className="pt-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-white/5 rounded-md animate-pulse"
            style={{ width: `${widths[i % widths.length]}%` }}
          />
        ))}
      </div>
    </div>
  );
}
