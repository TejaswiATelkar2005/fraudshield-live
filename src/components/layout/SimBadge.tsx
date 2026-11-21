import React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimBadgeProps {
  className?: string;
}

export function SimBadge({ className }: SimBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold",
        "bg-amber-500/10 text-amber-300 border border-amber-500/30 tracking-wide select-none shadow-sm",
        className
      )}
      role="note"
      aria-label="Simulation notice: synthetic data"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
      </span>
      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
      <span>Simulation: synthetic data</span>
    </div>
  );
}
