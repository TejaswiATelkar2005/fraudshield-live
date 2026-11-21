"use client";

import { useRef, useEffect, useState } from "react";
import { Smartphone, CreditCard, Building2 } from "lucide-react";
import type { ScoredTransaction, Channel } from "@/lib/types";
import { formatINR, formatTime } from "@/lib/utils";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { EmptyState } from "@/components/shared/EmptyState";

interface TransactionFeedProps {
  transactions: ScoredTransaction[];
}

const channelIcon: Record<Channel, React.ReactNode> = {
  UPI: <Smartphone className="w-4 h-4 text-cyan-400" />,
  Card: <CreditCard className="w-4 h-4 text-purple-400" />,
  NetBanking: <Building2 className="w-4 h-4 text-blue-400" />,
};

function probColor(prob: number): string {
  if (prob < 0.3) return "text-emerald-400";
  if (prob < 0.7) return "text-amber-400";
  return "text-red-400";
}

function maskCustomerId(id: string): string {
  if (id.length <= 4) return id;
  return `CUST-****${id.slice(-4)}`;
}

function FeedRow({ tx, isNew }: { tx: ScoredTransaction; isNew: boolean }) {
  const [visible, setVisible] = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
  }, [isNew]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      {/* Channel icon */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
        {channelIcon[tx.channel]}
      </div>

      {/* Customer info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">
          {maskCustomerId(tx.customerId)}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {tx.city} · {tx.merchantCategory}
        </p>
      </div>

      {/* Amount */}
      <div className="flex-shrink-0 text-sm font-semibold text-slate-200">
        {formatINR(tx.amountINR)}
      </div>

      {/* Risk badge */}
      <div className="flex-shrink-0">
        <RiskBadge decision={tx.score.decision} />
      </div>

      {/* Fraud % */}
      <div
        className={`flex-shrink-0 text-sm font-bold w-12 text-right ${probColor(
          tx.score.fraudProbability
        )}`}
      >
        {Math.round(tx.score.fraudProbability * 100)}%
      </div>

      {/* Time */}
      <div className="flex-shrink-0 text-xs text-slate-500 w-20 text-right">
        {formatTime(tx.timestamp)}
      </div>
    </div>
  );
}

export function TransactionFeed({ transactions }: TransactionFeedProps) {
  const prevIdsRef = useRef<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const displayed = transactions.slice(0, 50);

  useEffect(() => {
    // Update the prev IDs after render
    prevIdsRef.current = new Set(displayed.map((t) => t.id));
  });

  if (displayed.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Transactions will appear here once the simulator is running."
        icon={Smartphone}
      />
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Live Transactions</h3>
        <span className="text-xs text-slate-500">{displayed.length} shown</span>
      </div>

      {/* Column labels */}
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/40 border-b border-slate-700/30">
        <div className="w-8 flex-shrink-0" />
        <div className="flex-1 text-xs font-medium text-slate-500">Customer</div>
        <div className="flex-shrink-0 text-xs font-medium text-slate-500 w-24">Amount</div>
        <div className="flex-shrink-0 text-xs font-medium text-slate-500 w-20">Decision</div>
        <div className="flex-shrink-0 text-xs font-medium text-slate-500 w-12 text-right">Risk</div>
        <div className="flex-shrink-0 text-xs font-medium text-slate-500 w-20 text-right">Time</div>
      </div>

      {/* Scrollable list */}
      <div
        ref={listRef}
        className="overflow-y-auto"
        style={{ maxHeight: "500px" }}
      >
        {displayed.map((tx, idx) => (
          <FeedRow
            key={tx.id}
            tx={tx}
            isNew={idx === 0 && !prevIdsRef.current.has(tx.id)}
          />
        ))}
      </div>
    </div>
  );
}
