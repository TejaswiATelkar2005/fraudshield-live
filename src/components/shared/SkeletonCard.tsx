import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "bg-slate-800/80 border border-slate-700/50 rounded-xl p-4 shadow-sm animate-pulse flex flex-col justify-between",
        className
      )}
      aria-hidden="true"
    >
      <div className="h-4 bg-slate-700/60 rounded w-1/3 mb-3" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-slate-700/40 rounded"
            style={{ width: `${Math.max(40, 100 - i * 20)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
