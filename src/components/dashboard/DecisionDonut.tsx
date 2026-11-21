"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts";
import type { ScoredTransaction, Decision } from "@/lib/types";
import { EmptyState } from "@/components/shared/EmptyState";
import { ShieldOff } from "lucide-react";

interface DecisionDonutProps {
  transactions: ScoredTransaction[];
}

const DECISION_ORDER: Decision[] = ["APPROVED", "REVIEW", "HELD"];

const COLORS: Record<Decision, string> = {
  APPROVED: "#10b981",
  REVIEW: "#f59e0b",
  HELD: "#ef4444",
};

const LABELS: Record<Decision, string> = {
  APPROVED: "Approved",
  REVIEW: "In Review",
  HELD: "Held",
};

interface CustomLabelProps {
  cx: number;
  cy: number;
  total: number;
}

function CenterLabel({ cx, cy, total }: CustomLabelProps) {
  return (
    <>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#e2e8f0" fontSize={28} fontWeight={700}>
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize={11}>
        total
      </text>
    </>
  );
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: { fill: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-2 shadow-xl text-xs">
      <p style={{ color: item.payload.fill }} className="font-semibold">
        {item.name}
      </p>
      <p className="text-slate-300">{item.value} transactions</p>
    </div>
  );
}

export function DecisionDonut({ transactions }: DecisionDonutProps) {
  const counts = transactions.reduce<Record<Decision, number>>(
    (acc, tx) => {
      acc[tx.score.decision] = (acc[tx.score.decision] ?? 0) + 1;
      return acc;
    },
    { APPROVED: 0, REVIEW: 0, HELD: 0 }
  );

  const data = DECISION_ORDER.map((d) => ({
    name: LABELS[d],
    value: counts[d],
    fill: COLORS[d],
  })).filter((d) => d.value > 0);

  const total = transactions.length;

  if (total === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-lg h-full flex flex-col">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Decision Distribution</h3>
        <EmptyState
          title="No transactions yet"
          description="Decision breakdown will appear here."
          icon={ShieldOff}
        />
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-lg h-full flex flex-col">
      <h3 className="text-sm font-semibold text-slate-200 mb-2">Decision Distribution</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={104}
              dataKey="value"
              paddingAngle={2}
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} stroke="transparent" />
              ))}
            </Pie>
            <text
              x="50%"
              y="46%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#e2e8f0"
              fontSize={28}
              fontWeight={700}
            >
              {total}
            </text>
            <text
              x="50%"
              y="56%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#94a3b8"
              fontSize={11}
            >
              total
            </text>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "8px", fontSize: "12px", color: "#94a3b8" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
