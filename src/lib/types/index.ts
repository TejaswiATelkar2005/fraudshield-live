export type Channel = "UPI" | "Card" | "NetBanking";

export type Decision = "APPROVED" | "REVIEW" | "HELD";

export type AlertStatus = "OPEN" | "CONFIRMED_FRAUD" | "FALSE_ALARM" | "APPROVED";

export interface Transaction {
  id: string;
  timestamp: string; // ISO 8601 string
  customerId: string;
  channel: Channel;
  amountINR: number;
  merchantCategory: string;
  city: string;
  deviceId: string;
  isNewDevice: boolean;
  isForeignLocation: boolean;
  hourOfDay: number; // 0..23
  txnsLast10Min: number;
}

export interface TransactionScore {
  fraudProbability: number; // 0..1
  decision: Decision;
  topReasons: string[];
  latencyMs?: number;
  scorerMode: "mock" | "vertex";
}

export interface ScoredTransaction extends Transaction {
  score: TransactionScore;
  alertStatus: AlertStatus;
  analystNote?: string;
  analystId?: string;
  resolvedAt?: string;
}

export interface KpiSnapshot {
  txnsPerMin: number;
  approvedPct: number;
  inReview: number;
  held: number;
  estimatedSavedINR: number;
  totalTxns: number;
}

export interface TimeSeriesPoint {
  time: string;
  fraudProb: number;
  volume: number;
  heldCount: number;
  reviewCount: number;
}

export interface SimulatorStatus {
  isRunning: boolean;
  intervalMs: number;
  burstActive: boolean;
  scorerMode: "mock" | "vertex";
  totalGenerated: number;
  lastGeneratedAt?: string;
}

export interface ArchitectureStage {
  id: string;
  name: string;
  service: string;
  description: string;
  tech: string;
  active: boolean;
  status: "idle" | "processing" | "completed";
  latencyMs: number;
}
