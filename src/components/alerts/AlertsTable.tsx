"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Smartphone,
  CreditCard,
  Building2,
  ArrowUpDown,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { ScoredTransaction, Decision, AlertStatus, Channel } from "@/lib/types";
import { cn, formatINR, formatTime, maskCustomerId } from "@/lib/utils";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { AlertDrawer } from "./AlertDrawer";

type SortKey = "amountINR" | "fraudProbability";
type SortDir = "asc" | "desc";

function ChannelIcon({ channel }: { channel: Channel }) {
  const cls = "h-4 w-4 text-slate-400";
  if (channel === "UPI") return <Smartphone className={cls} />;
  if (channel === "Card") return <CreditCard className={cls} />;
  return <Building2 className={cls} />;
}

function StatusPill({ status }: { status: AlertStatus }) {
  const configs: Record<AlertStatus, { label: string; cls: string; Icon: React.ElementType }> = {
    OPEN: { label: "Open", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30", Icon: Clock },
    CONFIRMED_FRAUD: { label: "Fraud", cls: "bg-red-500/15 text-red-300 border-red-500/30", Icon: XCircle },
    FALSE_ALARM: { label: "False Alarm", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30", Icon: CheckCircle2 },
    APPROVED: { label: "Approved", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", Icon: CheckCircle2 },
  };
  const { label, cls, Icon } = configs[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function AlertsTable() {
  const [transactions, setTransactions] = useState<ScoredTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ScoredTransaction | null>(null);
  const [decisionFilter, setDecisionFilter] = useState<"ALL" | "REVIEW" | "HELD">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CONFIRMED_FRAUD" | "FALSE_ALARM">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("fraudProbability");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/transactions?limit=200");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json()) as ScoredTransaction[];
      // Filter only REVIEW + HELD
      setTransactions(data.filter((t) => t.score.decision === "REVIEW" || t.score.decision === "HELD"));
    } catch {
      // silent – keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAlerts();
    const id = setInterval(() => void fetchAlerts(), 10_000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  const handleUpdate = useCallback((updated: ScoredTransaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelected(updated);
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = transactions
    .filter((t) => decisionFilter === "ALL" || t.score.decision === decisionFilter)
    .filter((t) => statusFilter === "ALL" || t.alertStatus === statusFilter)
    .sort((a, b) => {
      const va = sortKey === "amountINR" ? a.amountINR : a.score.fraudProbability;
      const vb = sortKey === "amountINR" ? b.amountINR : b.score.fraudProbability;
      return sortDir === "asc" ? va - vb : vb - va;
    });

  if (loading) return <SkeletonCard lines={8} className="mt-4" />;

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-1 text-sm text-slate-400">
          <Filter className="h-4 w-4" /> Filter:
        </span>

        {/* Decision filter */}
        <div className="flex gap-1 rounded-lg bg-slate-800 p-1">
          {(["ALL", "REVIEW", "HELD"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDecisionFilter(d)}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium transition-colors",
                decisionFilter === d
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 rounded-lg bg-slate-800 p-1">
          {(["ALL", "OPEN", "CONFIRMED_FRAUD", "FALSE_ALARM"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium transition-colors",
                statusFilter === s
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {s === "CONFIRMED_FRAUD" ? "Fraud" : s === "FALSE_ALARM" ? "False Alarm" : s}
            </button>
          ))}
        </div>

        <button
          onClick={() => void fetchAlerts()}
          className="ml-auto flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>

        <span className="text-xs text-slate-500">{filtered.length} alerts</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No alerts found"
          description="Adjust filters or wait for the simulator to generate flagged transactions."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700/60">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700/60 bg-slate-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Channel</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Customer</th>
                <th
                  className="cursor-pointer px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400 hover:text-cyan-400 select-none"
                  onClick={() => toggleSort("amountINR")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Amount <ArrowUpDown className="h-3 w-3" />
                    {sortKey === "amountINR" && <span className="text-cyan-400">{sortDir === "asc" ? "↑" : "↓"}</span>}
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">City</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Decision</th>
                <th
                  className="cursor-pointer px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400 hover:text-cyan-400 select-none"
                  onClick={() => toggleSort("fraudProbability")}
                >
                  <span className="flex items-center justify-end gap-1">
                    Fraud% <ArrowUpDown className="h-3 w-3" />
                    {sortKey === "fraudProbability" && <span className="text-cyan-400">{sortDir === "asc" ? "↑" : "↓"}</span>}
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {filtered.map((txn) => (
                <tr
                  key={txn.id}
                  onClick={() => setSelected(txn)}
                  className="cursor-pointer transition-colors hover:bg-slate-800/60"
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{formatTime(txn.timestamp)}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <ChannelIcon channel={txn.channel} />
                      <span className="text-slate-300">{txn.channel}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">{maskCustomerId(txn.customerId)}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-200">{formatINR(txn.amountINR)}</td>
                  <td className="px-4 py-3 text-slate-300">{txn.city}</td>
                  <td className="px-4 py-3">
                    <RiskBadge decision={txn.score.decision} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "font-mono font-semibold",
                        txn.score.fraudProbability > 0.7
                          ? "text-red-400"
                          : txn.score.fraudProbability > 0.3
                          ? "text-amber-400"
                          : "text-emerald-400"
                      )}
                    >
                      {(txn.score.fraudProbability * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={txn.alertStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(txn); }}
                      className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-600 transition-colors"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <AlertDrawer
          transaction={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
}
