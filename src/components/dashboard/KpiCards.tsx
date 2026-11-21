"use client";

import {
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  ShieldOff,
  IndianRupee,
} from "lucide-react";
import type { KpiSnapshot } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { SkeletonCard } from "@/components/shared/SkeletonCard";

interface KpiCardsProps {
  kpi: KpiSnapshot | null;
  loading: boolean;
}

interface CardConfig {
  key: Extract<keyof KpiSnapshot, string>;
  label: string;
  icon: React.ReactNode;
  format: (v: number) => string;
  color: string;
  border: string;
  iconBg: string;
}

const cards: CardConfig[] = [
  {
    key: "txnsPerMin",
    label: "Transactions / min",
    icon: <TrendingUp className="w-5 h-5" />,
    format: (v) => v.toFixed(1),
    color: "text-blue-400",
    border: "border-blue-500/20",
    iconBg: "bg-blue-500/15",
  },
  {
    key: "approvedPct",
    label: "Approved %",
    icon: <CheckCircle className="w-5 h-5" />,
    format: (v) => `${v.toFixed(1)}%`,
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/15",
  },
  {
    key: "inReview",
    label: "In Review",
    icon: <AlertTriangle className="w-5 h-5" />,
    format: (v) => v.toString(),
    color: "text-amber-400",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/15",
  },
  {
    key: "held",
    label: "Held / Blocked",
    icon: <ShieldOff className="w-5 h-5" />,
    format: (v) => v.toString(),
    color: "text-red-400",
    border: "border-red-500/20",
    iconBg: "bg-red-500/15",
  },
  {
    key: "estimatedSavedINR",
    label: "Est. Saved",
    icon: <IndianRupee className="w-5 h-5" />,
    format: (v) => formatINR(v),
    color: "text-purple-400",
    border: "border-purple-500/20",
    iconBg: "bg-purple-500/15",
  },
];

export function KpiCards({ kpi, loading }: KpiCardsProps) {
  if (loading || !kpi) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <SkeletonCard key={c.key} lines={2} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const value = kpi[card.key] as number;
        return (
          <div
            key={card.key}
            className={`bg-slate-800 border ${card.border} rounded-xl p-4 flex flex-col gap-3 shadow-lg`}
          >
            <div className={`${card.iconBg} ${card.color} w-9 h-9 rounded-lg flex items-center justify-center`}>
              {card.icon}
            </div>
            <div>
              <p className={`text-2xl font-bold ${card.color} leading-none`}>
                {card.format(value)}
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-tight">
                {card.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
