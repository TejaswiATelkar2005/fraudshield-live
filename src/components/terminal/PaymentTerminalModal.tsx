"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CreditCard,
  Smartphone,
  Building2,
  X,
  ShieldCheck,
  Zap,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Globe,
  Fingerprint,
  Activity,
} from "lucide-react";
import type { Channel, ScoredTransaction } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { FraudGauge } from "@/components/shared/FraudGauge";

interface PaymentTerminalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentTerminalModal({
  open,
  onOpenChange,
}: PaymentTerminalModalProps) {
  const [channel, setChannel] = useState<Channel>("UPI");
  const [amount, setAmount] = useState<number>(2450);
  const [merchant, setMerchant] = useState<string>("Electronics & Gadgets");
  const [city, setCity] = useState<string>("Bengaluru");
  const [isNewDevice, setIsNewDevice] = useState<boolean>(false);
  const [isForeignLocation, setIsForeignLocation] = useState<boolean>(false);
  const [highVelocity, setHighVelocity] = useState<boolean>(false);
  const [highRiskMerchant, setHighRiskMerchant] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ScoredTransaction | null>(null);

  const presets = [
    { label: "Normal UPI (₹450)", amount: 450, channel: "UPI" as Channel, city: "Bengaluru", isNewDevice: false, isForeign: false, highVel: false, highRisk: false },
    { label: "Card Retail (₹4,200)", amount: 4200, channel: "Card" as Channel, city: "Mumbai", isNewDevice: false, isForeign: false, highVel: false, highRisk: false },
    { label: "Suspicious NetBanking (₹68,500)", amount: 68500, channel: "NetBanking" as Channel, city: "Delhi NCR", isNewDevice: true, isForeign: false, highVel: true, highRisk: false },
    { label: "⚡ High Fraud Attack (₹3,40,000)", amount: 340000, channel: "Card" as Channel, city: "Dubai (Foreign)", isNewDevice: true, isForeign: true, highVel: true, highRisk: true },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setAmount(p.amount);
    setChannel(p.channel);
    setCity(p.city);
    setIsNewDevice(p.isNewDevice);
    setIsForeignLocation(p.isForeign);
    setHighVelocity(p.highVel);
    setHighRiskMerchant(p.highRisk);
    if (p.highRisk) setMerchant("Crypto / Jewelry");
    else setMerchant("Electronics & Gadgets");
  };

  const handlePay = async () => {
    setLoading(true);
    setResult(null);

    const payload = {
      customerId: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      channel,
      amountINR: Number(amount),
      merchantCategory: highRiskMerchant ? "Crypto / Jewelry" : merchant,
      city: isForeignLocation ? "Dubai (Foreign)" : city,
      deviceId: isNewDevice ? `DEV-NEW-${Math.floor(10000 + Math.random() * 90000)}` : "DEV-TRUSTED-01",
      isNewDevice,
      isForeignLocation,
      hourOfDay: isForeignLocation ? 3 : new Date().getHours(),
      txnsLast10Min: highVelocity ? 9 : 1,
    };

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const scored = (await res.json()) as ScoredTransaction;
        setResult(scored);
      }
    } catch (err) {
      console.error("Payment failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-slate-100">
                  Customer Payment Terminal
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-400">
                  Simulate live payment ingress through Vertex AI fraud detection
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {!result ? (
            <div className="space-y-4">
              {/* Quick Presets */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
                  Quick Viva Scenarios:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p)}
                      className="text-left p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500/60 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Channel Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Payment Method / Rail
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "UPI" as Channel, label: "UPI (VPA)", icon: Smartphone },
                    { id: "Card" as Channel, label: "Card (EMV)", icon: CreditCard },
                    { id: "NetBanking" as Channel, label: "NetBanking", icon: Building2 },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setChannel(item.id)}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                        channel === item.id
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                          : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700/60"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Transaction Amount (INR ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              {/* Risk Feature Anomaly Toggles */}
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3.5 space-y-2.5">
                <span className="text-xs font-semibold text-slate-300 block uppercase tracking-wider">
                  Inject Risk Signals (Features for AI)
                </span>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-amber-400" />
                    New Hardware / Unrecognized Device
                  </span>
                  <input
                    type="checkbox"
                    checked={isNewDevice}
                    onChange={(e) => setIsNewDevice(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-rose-400" />
                    Foreign IP Location (Dubai / London)
                  </span>
                  <input
                    type="checkbox"
                    checked={isForeignLocation}
                    onChange={(e) => setIsForeignLocation(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Velocity Spike (9 txns in last 10 min)
                  </span>
                  <input
                    type="checkbox"
                    checked={highVelocity}
                    onChange={(e) => setHighVelocity(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    High-Risk Merchant (Crypto / Jewelry)
                  </span>
                  <input
                    type="checkbox"
                    checked={highRiskMerchant}
                    onChange={(e) => setHighRiskMerchant(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>
              </div>

              {/* Authorize Button */}
              <button
                onClick={handlePay}
                disabled={loading || amount <= 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {loading ? "Evaluating in Vertex AI Engine…" : `Authorize Payment (${formatINR(amount)})`}
              </button>
            </div>
          ) : (
            /* Live Result Display */
            <div className="space-y-4">
              <div className="flex flex-col items-center p-4 bg-slate-800/80 border border-slate-700/60 rounded-xl text-center">
                <FraudGauge probability={result.score.fraudProbability} size={160} />
                <div className="mt-2">
                  <RiskBadge decision={result.score.decision} className="text-sm px-3 py-1" />
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  Evaluated in <span className="font-mono text-cyan-400 font-semibold">{result.score.latencyMs || 42}ms</span> via {result.score.scorerMode === "vertex" ? "Vertex AI" : "Scoring Engine"}
                </div>
              </div>

              {/* Explainable Reasons */}
              <div className="rounded-xl bg-slate-800/50 border border-slate-700/60 p-4">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  AI Model Decision Factors:
                </h4>
                <ul className="space-y-1.5 text-xs">
                  {result.score.topReasons.map((reason, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                >
                  Test Another Payment
                </button>
                <button
                  onClick={() => {
                    onOpenChange(false);
                    setResult(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                >
                  Done (Watch Feed)
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
