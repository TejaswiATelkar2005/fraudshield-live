import React from "react";
import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import type { Decision } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  decision: Decision;
  className?: string;
}

export function RiskBadge({ decision, className }: RiskBadgeProps) {
  switch (decision) {
    case "APPROVED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide",
            "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
            className
          )}
          role="status"
          aria-label="Risk decision: Approved"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>APPROVED</span>
        </span>
      );
    case "REVIEW":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide",
            "bg-amber-500/15 text-amber-300 border border-amber-500/30",
            className
          )}
          role="status"
          aria-label="Risk decision: In Review (Step-up verification required)"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
          <span>REVIEW</span>
        </span>
      );
    case "HELD":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide",
            "bg-rose-500/15 text-rose-300 border border-rose-500/30",
            className
          )}
          role="status"
          aria-label="Risk decision: Held (High risk blocked)"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />
          <span>HELD</span>
        </span>
      );
    default:
      return null;
  }
}
