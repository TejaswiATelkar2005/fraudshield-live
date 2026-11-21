"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  Zap,
  Gauge,
  Activity,
  Server,
  CloudLightning,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { SimulatorStatus } from "@/lib/types";

export default function SimulatorPage() {
  const [status, setStatus] = useState<SimulatorStatus | null>(null);
  const [speed, setSpeed] = useState<number>(2000);
  const [loading, setLoading] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "info" } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/simulator");
      if (res.ok) {
        const data = (await res.json()) as SimulatorStatus;
        setStatus(data);
        setSpeed(data.intervalMs);
      }
    } catch (err) {
      console.error("Failed to fetch simulator status", err);
    }
  };

  useEffect(() => {
    void fetchStatus();
    const id = setInterval(fetchStatus, 4000);
    return () => clearInterval(id);
  }, []);

  const sendAction = async (action: string, payload: Record<string, unknown> = {}) => {
    setLoading(true);
    try {
      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
      }
    } catch (err) {
      console.error(`Action ${action} failed`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartStop = async () => {
    if (status?.isRunning) {
      await sendAction("stop");
      setMessage({ text: "Simulator paused. Inbound stream halted.", type: "info" });
    } else {
      await sendAction("start");
      setMessage({ text: "Simulator started. Transactions generating every " + (speed / 1000).toFixed(1) + "s", type: "success" });
    }
  };

  const handleSpeedChange = async (newSpeed: number) => {
    setSpeed(newSpeed);
    await sendAction("speed", { speedMs: newSpeed });
  };

  const handleBurst = async () => {
    setBursting(true);
    setMessage({ text: "⚡ Injecting burst of 5-8 fraudulent transactions into pipeline…", type: "info" });
    await sendAction("burst");
    setTimeout(() => {
      setBursting(false);
      setMessage({ text: "✓ Fraud burst delivered. Watch the Alerts Queue and Live Monitor update!", type: "success" });
    }, 1800);
  };

  const handleSingleTick = async () => {
    await sendAction("tick");
    setMessage({ text: "Manually triggered 1 synthetic payment through scoring pipeline", type: "info" });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Transaction Stream Simulator
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Synthetic payment traffic generator mimicking real-world UPI, Card, and NetBanking customer activity.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stream Status Card */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Generator State
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  status?.isRunning
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    status?.isRunning ? "bg-emerald-400 animate-ping" : "bg-amber-400"
                  }`}
                />
                {status?.isRunning ? "Active & Streaming" : "Paused"}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-3xl font-extrabold text-slate-100 font-mono">
                  {status?.totalGenerated ?? 0}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Total synthetic payments generated</div>
              </div>

              <div className="pt-2 border-t border-slate-700/40 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Current cadence:</span>
                  <span className="text-slate-200 font-medium">1 txn / {(speed / 1000).toFixed(1)}s</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Synthetic fraud rate:</span>
                  <span className="text-amber-400 font-medium">~3.5% baseline</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-700/60 flex gap-2">
            <button
              onClick={handleStartStop}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all shadow-md ${
                status?.isRunning
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                  : "bg-emerald-600 text-white hover:bg-emerald-500"
              }`}
            >
              {status?.isRunning ? (
                <>
                  <Pause className="w-4 h-4" /> Pause Simulator
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Resume Simulator
                </>
              )}
            </button>
            <button
              onClick={handleSingleTick}
              disabled={loading}
              title="Generate exactly 1 single transaction right now"
              className="px-3 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 text-xs font-medium"
            >
              +1
            </button>
          </div>
        </div>

        {/* Speed Adjustment Card */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Speed & Cadence
              </span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Control the frequency of simulated customer transactions emitted to the stream.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-medium mb-1">
                  <span className="text-slate-300">Interval</span>
                  <span className="text-cyan-400 font-mono">{(speed / 1000).toFixed(1)} seconds</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={250}
                  value={speed}
                  onChange={(e) => void handleSpeedChange(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>Fast (0.5s)</span>
                  <span>Normal (2.0s)</span>
                  <span>Slow (5.0s)</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                {[1000, 2000, 3000].map((ms) => (
                  <button
                    key={ms}
                    onClick={() => void handleSpeedChange(ms)}
                    className={`py-1.5 px-2 rounded text-xs font-mono font-medium border transition-colors ${
                      speed === ms
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-slate-700/60 text-slate-300 border-slate-600 hover:bg-slate-700"
                    }`}
                  >
                    {ms / 1000}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-700/60 text-[11px] text-slate-400">
            Est. throughput: ~{Math.round(60 / (speed / 1000))} transactions / minute
          </div>
        </div>

        {/* Fraud Injection & Model Mode */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Viva Demo Weapons
              </span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Instantly create a sudden anomaly spike to test alerts and ML model scoring under pressure.
            </p>

            <button
              onClick={handleBurst}
              disabled={bursting || loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-900/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <CloudLightning className={`w-5 h-5 ${bursting ? "animate-bounce" : ""}`} />
              {bursting ? "Injecting Fraud Burst…" : "⚡ Inject Fraud Burst"}
            </button>

            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Fires 5–8 high-velocity, cross-border night-time high-ticket transactions.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-700/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Active Scorer Engine:</span>
              <span className="px-2 py-0.5 rounded bg-slate-700 text-cyan-300 font-mono text-[11px] font-semibold border border-slate-600">
                {status?.scorerMode === "vertex" ? "Vertex AI Endpoint" : "Deterministic Rule Scorer (Mock)"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Synthetic Data Dictionary / Viva Reference */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-md mt-2">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-3">
          <Server className="w-4 h-4 text-cyan-400" />
          Synthetic Features Generated Per Transaction
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="font-mono text-cyan-300 font-semibold mb-1">amountINR</div>
            <p className="text-slate-400">Normal: ₹50–₹24,000. Fraud: ₹85,000–₹4,00,000 high-ticket outliers.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="font-mono text-cyan-300 font-semibold mb-1">channel</div>
            <p className="text-slate-400">UPI (micro-payments), Card (e-commerce & retail), NetBanking (corporate & wires).</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="font-mono text-cyan-300 font-semibold mb-1">isNewDevice & isForeignLocation</div>
            <p className="text-slate-400">Flags new hardware IDs and IPs originating outside India (Dubai, London, Singapore).</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="font-mono text-cyan-300 font-semibold mb-1">hourOfDay</div>
            <p className="text-slate-400">0–23 hr format. Nocturnal transactions (23:00–04:00) flag higher circadian risk.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="font-mono text-cyan-300 font-semibold mb-1">txnsLast10Min</div>
            <p className="text-slate-400">Sliding frequency velocity metric. Escalates rapidly during card stuffing & burst attacks.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="font-mono text-cyan-300 font-semibold mb-1">merchantCategory</div>
            <p className="text-slate-400">Low-risk (Groceries, Utilities) vs High-risk (Crypto, Jewelry, Casino, Luxury).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
