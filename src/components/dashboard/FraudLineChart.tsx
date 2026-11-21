"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Bar,
} from "recharts";
import type { TimeSeriesPoint } from "@/lib/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrendingUp } from "lucide-react";

interface FraudLineChartProps {
  data: TimeSeriesPoint[];
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.name === "Fraud Prob" ? (Number(entry.value) * 100).toFixed(1) + "%" : entry.value}
        </p>
      ))}
    </div>
  );
}

export function FraudLineChart({ data }: FraudLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-lg">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">
          Fraud Probability &amp; Volume Over Time
        </h3>
        <EmptyState
          title="No data yet"
          description="Chart data will appear once transactions are processed."
          icon={TrendingUp}
        />
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-lg">
      <h3 className="text-sm font-semibold text-slate-200 mb-4">
        Fraud Probability &amp; Volume Over Time
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
          <XAxis
            dataKey="time"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
          />
          {/* Left Y: fraud probability */}
          <YAxis
            yAxisId="prob"
            orientation="left"
            domain={[0, 1]}
            tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
            tick={{ fill: "#f87171", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          {/* Right Y: volume */}
          <YAxis
            yAxisId="vol"
            orientation="right"
            tick={{ fill: "#60a5fa", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: "12px", fontSize: "12px", color: "#94a3b8" }}
          />
          <Bar
            yAxisId="vol"
            dataKey="volume"
            name="Volume"
            fill="#3b82f6"
            opacity={0.5}
            radius={[2, 2, 0, 0]}
          />
          <Line
            yAxisId="prob"
            type="monotone"
            dataKey="fraudProbAvg"
            name="Fraud Prob"
            stroke="#f43f5e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#f43f5e" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
