import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Decision } from "@/lib/types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format an amount in INR with Indian comma numbering system (e.g., ₹1,50,000)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "₹0";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ISO or epoch timestamp into local 24-hr time HH:mm:ss
 */
export function formatTime(timestamp: string | number): string {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return "--:--:--";
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "--:--:--";
  }
}

/**
 * Mask customer IDs for privacy in fintech UI (e.g., CUST-****8492)
 */
export function maskCustomerId(id: string): string {
  if (!id) return "CUST-****";
  const clean = id.replace(/^CUST[-_]?/i, "");
  if (clean.length <= 4) {
    return `CUST-****${clean}`;
  }
  return `CUST-****${clean.slice(-4)}`;
}

/**
 * Return background styling for decisions
 */
export function decisionBg(decision: Decision): string {
  switch (decision) {
    case "APPROVED":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "REVIEW":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "HELD":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}

/**
 * Color class for fraud probability values
 */
export function probColor(prob: number): string {
  if (prob < 0.3) return "text-emerald-400";
  if (prob < 0.7) return "text-amber-400";
  return "text-red-400";
}
