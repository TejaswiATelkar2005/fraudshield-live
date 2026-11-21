"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
  Clock,
  Smartphone,
  CreditCard,
  Building2,
  ShieldAlert,
  Layers,
  AlertCircle,
  Fingerprint,
  Globe,
  Activity,
} from "lucide-react";
import type { ScoredTransaction, AlertStatus } from "@/lib/types";
import { cn, formatINR, formatTime, maskCustomerId } from "@/lib/utils";
import { FraudGauge } from "@/components/shared/FraudGauge";
import { useAuth } from "@/contexts/AuthContext";
import { updateAlertInFirestore } from "@/lib/firebase/firestore";

interface AlertDrawerProps {
  transaction: ScoredTransaction;
  onClose: () => void;
  onUpdate: (updated: ScoredTransaction) => void;
}

const REASON_ICONS: Record<string, React.ElementType> = {
  "High amount": AlertCircle,
  "New device": Fingerprint,
  "Foreign location": Globe,
  "High velocity": Activity,
  "Late night": Clock,
  "High risk merchant": ShieldAlert,
  default: AlertTriangle,
};

function reasonIcon(reason: string): React.ElementType {
  for (const [key, Icon] of Object.entries(REASON_ICONS)) {
    if (reason.toLowerCase().includes(key.toLowerCase())) return Icon;
  }
  return REASON_ICONS.default;
}

const STATUS_LABELS: Record<AlertStatus, string> = {
  OPEN: "Open — pending review",
  CONFIRMED_FRAUD: "✓ Confirmed as Fraud",
  FALSE_ALARM: "✗ Marked False Alarm",
  APPROVED: "✓ Approved",
};

export function AlertDrawer({ transaction: txn, onClose, onUpdate }: AlertDrawerProps) {
  const { user } = useAuth();
  const [note, setNote] = useState(txn.analystNote ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isResolved = txn.alertStatus !== "OPEN";

  const submit = async (status: AlertStatus) => {
    setLoading(true);
    setError(null);
    const analystId = user?.displayName ? `${user.displayName} (${user.email})` : (user?.email || "analyst@bank.com");
    try {
      const res = await fetch(`/api/transactions/${txn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, analystNote: note, analystId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = (await res.json()) as ScoredTransaction;

      // Sync with Firestore in background
      void updateAlertInFirestore(txn.id, {
        alertStatus: status,
        analystNote: note,
        analystId,
        resolvedAt: new Date().toISOString(),
      });

      onUpdate(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const ChannelIcon =
    txn.channel === "UPI" ? Smartphone : txn.channel === "Card" ? CreditCard : Building2;

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed right-0 top-0 z-50 h-full w-full max-w-xl overflow-y-auto",
            "bg-slate-900 border-l border-slate-700/60 shadow-2xl",
            "animate-slide-in-right"
          )}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700/60 bg-slate-900/95 px-6 py-4 backdrop-blur-sm">
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-100">
                Alert Review
              </Dialog.Title>
              <Dialog.Description className="text-xs text-slate-400">
                {txn.id} · {formatTime(txn.timestamp)}
              </Dialog.Description>
            </div>
            <Dialog.Close
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="p-6 space-y-6">
            {/* Gauge + resolved status */}
            <div className="flex flex-col items-center gap-3">
              <FraudGauge probability={txn.score.fraudProbability} />
              {isResolved && (
                <span
                  className={cn(
                    "rounded-full px-4 py-1 text-sm font-medium",
                    txn.alertStatus === "CONFIRMED_FRAUD"
                      ? "bg-red-500/15 text-red-300"
                      : txn.alertStatus === "FALSE_ALARM"
                      ? "bg-slate-500/15 text-slate-300"
                      : "bg-emerald-500/15 text-emerald-300"
                  )}
                >
                  {STATUS_LABELS[txn.alertStatus]}
                </span>
              )}
              <p className="text-xs text-slate-500">
                Scorer: {txn.score.scorerMode === "vertex" ? "Vertex AI (Cloud)" : "Mock (Offline)"}
              </p>
            </div>

            {/* Top 3 reasons */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Layers className="h-4 w-4 text-cyan-400" />
                Risk Factors
              </h3>
              <ul className="space-y-2">
                {txn.score.topReasons.slice(0, 3).map((reason: string, i: number) => {
                  const Icon = reasonIcon(reason);
                  return (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <Icon className="h-4 w-4 text-amber-400 shrink-0" />
                      {reason}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Transaction details */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-200">Transaction Details</h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-700/30">
                  {[
                    { label: "Customer", value: maskCustomerId(txn.customerId) },
                    {
                      label: "Channel",
                      value: (
                        <span className="flex items-center gap-1.5">
                          <ChannelIcon className="h-4 w-4 text-slate-400" />
                          {txn.channel}
                        </span>
                      ),
                    },
                    { label: "Amount", value: <span className="font-semibold">{formatINR(txn.amountINR)}</span> },
                    {
                      label: "City",
                      value: (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {txn.city}
                        </span>
                      ),
                    },
                    { label: "Merchant", value: txn.merchantCategory },
                    { label: "New Device", value: txn.isNewDevice ? "Yes ⚠" : "No" },
                    { label: "Foreign Location", value: txn.isForeignLocation ? "Yes ⚠" : "No" },
                    { label: "Velocity (10 min)", value: `${txn.txnsLast10Min} txns` },
                    { label: "Hour of Day", value: `${txn.hourOfDay}:00` },
                  ].map(({ label, value }) => (
                    <tr key={label}>
                      <td className="py-2 pr-4 text-xs text-slate-400">{label}</td>
                      <td className="py-2 text-slate-200">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Analyst note */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Analyst Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isResolved}
                placeholder="Add a note (optional)…"
                rows={3}
                className={cn(
                  "w-full rounded-lg border border-slate-700/60 bg-slate-800 px-3 py-2 text-sm text-slate-200",
                  "placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30",
                  "resize-none transition-colors",
                  isResolved && "opacity-50 cursor-not-allowed"
                )}
              />
              {txn.resolvedAt && (
                <p className="mt-1 text-xs text-slate-500">
                  Resolved {formatTime(txn.resolvedAt)} · {txn.analystId}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
            )}

            {/* Action buttons */}
            {!isResolved ? (
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => void submit("APPROVED")}
                  disabled={loading}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                    "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40",
                    "hover:bg-emerald-600/30 hover:border-emerald-400/60 hover:scale-105",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => void submit("CONFIRMED_FRAUD")}
                  disabled={loading}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                    "bg-red-600/20 text-red-300 border border-red-500/40",
                    "hover:bg-red-600/30 hover:border-red-400/60 hover:scale-105",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                  )}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Confirm Fraud
                </button>
                <button
                  onClick={() => void submit("FALSE_ALARM")}
                  disabled={loading}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                    "bg-slate-600/20 text-slate-300 border border-slate-500/40",
                    "hover:bg-slate-600/30 hover:border-slate-400/60 hover:scale-105",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                  )}
                >
                  <XCircle className="h-4 w-4" />
                  False Alarm
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3 text-center text-sm text-slate-400">
                This alert has been resolved. No further actions needed.
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
