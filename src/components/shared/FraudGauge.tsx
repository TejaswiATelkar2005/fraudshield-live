import React from "react";
import { cn } from "@/lib/utils";

interface FraudGaugeProps {
  probability: number; // 0 to 1
  size?: number;
  className?: string;
}

export function FraudGauge({
  probability,
  size = 180,
  className,
}: FraudGaugeProps) {
  const clamped = Math.max(0, Math.min(1, probability));
  const percentage = Math.round(clamped * 100);

  // Determine label & color
  let status = "LOW RISK";
  let color = "#10b981"; // emerald
  if (clamped >= 0.7) {
    status = "HIGH FRAUD RISK";
    color = "#ef4444"; // red
  } else if (clamped >= 0.3) {
    status = "ELEVATED RISK";
    color = "#f59e0b"; // amber
  }

  // Semi-circle math
  // Arc spans 180 degrees from 180 to 0 (left to right)
  const strokeWidth = 12;
  const radius = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const circumference = Math.PI * radius; // half circle length
  const strokeDashoffset = circumference - clamped * circumference;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size / 2 + 25 }}>
        <svg
          width={size}
          height={size / 2 + 25}
          viewBox={`0 0 ${size} ${size / 2 + 25}`}
          className="overflow-visible"
        >
          {/* Background track arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Foreground colored risk arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease-out, stroke 0.3s ease" }}
          />

          {/* Value text in center */}
          <text
            x={cx}
            y={cy - 12}
            textAnchor="middle"
            className="fill-slate-100 font-bold"
            fontSize="28"
          >
            {percentage}%
          </text>
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            fill={color}
            className="font-semibold tracking-wider text-[10px]"
          >
            {status}
          </text>
        </svg>
      </div>

      <div className="flex items-center justify-between w-full max-w-[180px] text-[10px] text-slate-500 font-mono mt-1 px-1">
        <span>0.00 (Safe)</span>
        <span>0.30</span>
        <span>0.70</span>
        <span>1.00 (Fraud)</span>
      </div>
    </div>
  );
}
