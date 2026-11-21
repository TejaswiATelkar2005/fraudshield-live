"use client";

import { useState } from "react";
import Link from "next/link";
import { useSSE } from "@/hooks/useSSE";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { TransactionFeed } from "@/components/dashboard/TransactionFeed";
import { FraudLineChart } from "@/components/dashboard/FraudLineChart";
import { DecisionDonut } from "@/components/dashboard/DecisionDonut";
import { Zap, Pause, Play, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

const SSE_URL = "/api/stream";

export function DashboardClient() {
  const { transactions, kpi, timeSeries, connected, error } = useSSE(SSE_URL);
  const [bursting, setBursting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [burstSuccess, setBurstSuccess] = useState(false);

  const handleBurst = async () => {
    setBursting(true);
    try {
      await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "burst" }),
      });
      setBurstSuccess(true);
      setTimeout(() => setBurstSuccess(false), 3000);
    } catch (err) {
      console.error("Burst failed", err);
    } finally {
      setTimeout(() => setBursting(false), 800);
    }
  };

  const handleTogglePlay = async () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    try {
      await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextPaused ? "stop" : "start" }),
      });
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stream connection banner if error */}
      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-sm rounded-lg px-4 py-2 flex items-center justify-between">
          <span>⚠ Stream connection interrupted: {error}</span>
          <span className="text-xs bg-red-500/20 px-2 py-0.5 rounded">Auto-reconnecting</span>
        </div>
      )}

      {/* Viva Demo Quick Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400 animate-ping"}`} />
            Stream: <span className="text-emerald-400 font-mono">{connected ? "Connected" : "Connecting…"}</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-xs text-slate-400">
            Cadence: <span className="text-slate-200 font-mono">1 txn / 2.0s</span>
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {burstSuccess && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Burst Injected!
            </span>
          )}

          <button
            onClick={handleBurst}
            disabled={bursting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-sm transition-all active:scale-95 disabled:opacity-50"
            title="Fire 5-8 fraudulent transactions into the stream immediately"
          >
            <Zap className={`w-3.5 h-3.5 ${bursting ? "animate-bounce" : ""}`} />
            {bursting ? "Injecting…" : "⚡ Inject Fraud Burst"}
          </button>

          <button
            onClick={handleTogglePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition-colors"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            {isPaused ? "Resume" : "Pause"}
          </button>

          {kpi && (kpi.inReview > 0 || kpi.held > 0) && (
            <Link
              href="/alerts"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{kpi.inReview + kpi.held} Alerts</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* KPI row */}
      <KpiCards kpi={kpi} loading={!connected && !kpi} />

      {/* Middle: feed + donut */}
      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Transaction feed — 60% */}
        <div className="lg:w-[60%]">
          <TransactionFeed transactions={transactions} />
        </div>

        {/* Decision donut — 40% */}
        <div className="lg:w-[40%]">
          <DecisionDonut transactions={transactions} />
        </div>
      </div>

      {/* Full-width line chart */}
      <FraudLineChart data={timeSeries} />
    </div>
  );
}
