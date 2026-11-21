import { DashboardClient } from "@/app/dashboard-client";

export default function LiveMonitorPage() {
  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
          Live Monitor
        </h1>
        {/* Real-time live dot indicator */}
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          Real-time
        </span>
      </div>

      {/* Client dashboard */}
      <DashboardClient />
    </div>
  );
}
