import { AlertsTable } from "@/components/alerts/AlertsTable";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Alerts Queue | FraudShield Live",
  description: "Real-time human-in-the-loop review queue for flagged high-risk transactions",
};

export default function AlertsPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Alerts Review Queue
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Human-in-the-loop triage queue for transactions flagged as <span className="text-amber-400 font-medium">REVIEW</span> (0.30–0.70) or <span className="text-rose-400 font-medium">HELD</span> (&gt;0.70).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/80 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Analyst Mode Active</span>
          </div>
        </div>
      </div>

      {/* Interactive Alerts Table with Filter, Sort, and Slide-over Drawer */}
      <AlertsTable />
    </div>
  );
}
