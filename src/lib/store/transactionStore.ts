import type {
  ScoredTransaction,
  Transaction,
  KpiSnapshot,
  TimeSeriesPoint,
  AlertStatus,
  Decision,
} from "@/lib/types";

type Listener = (event: StoreEvent) => void;

export type StoreEvent =
  | { type: "transaction"; data: ScoredTransaction }
  | { type: "update"; data: ScoredTransaction }
  | { type: "kpi"; data: KpiSnapshot };

class TransactionStore {
  private transactions: ScoredTransaction[] = [];
  private maxCapacity = 1000;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.seedInitialData();
  }

  /**
   * Subscribe to real-time store changes (for Server-Sent Events)
   */
  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: StoreEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("Error in store subscriber:", err);
      }
    }
  }

  /**
   * Add a newly scored transaction
   */
  public addTransaction(tx: ScoredTransaction): void {
    this.transactions.unshift(tx);
    if (this.transactions.length > this.maxCapacity) {
      this.transactions.pop();
    }
    this.notify({ type: "transaction", data: tx });
    this.notify({ type: "kpi", data: this.getKpiSnapshot() });
  }

  /**
   * Update an existing transaction (e.g., analyst resolution)
   */
  public updateTransaction(
    id: string,
    update: {
      alertStatus: AlertStatus;
      analystNote?: string;
      analystId?: string;
      resolvedAt?: string;
    }
  ): ScoredTransaction | null {
    const index = this.transactions.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = this.transactions[index];
    const updated: ScoredTransaction = {
      ...existing,
      alertStatus: update.alertStatus,
      analystNote: update.analystNote ?? existing.analystNote,
      analystId: update.analystId ?? existing.analystId ?? "analyst-1",
      resolvedAt: update.resolvedAt ?? new Date().toISOString(),
    };

    this.transactions[index] = updated;
    this.notify({ type: "update", data: updated });
    this.notify({ type: "kpi", data: this.getKpiSnapshot() });
    return updated;
  }

  /**
   * Get all transactions with optional limit and filter
   */
  public getTransactions(limit = 100, filterDecision?: Decision): ScoredTransaction[] {
    let result = this.transactions;
    if (filterDecision) {
      result = result.filter((t) => t.score.decision === filterDecision);
    }
    return result.slice(0, limit);
  }

  /**
   * Get transaction by ID
   */
  public getById(id: string): ScoredTransaction | undefined {
    return this.transactions.find((t) => t.id === id);
  }

  /**
   * Calculate live KPI metrics
   */
  public getKpiSnapshot(): KpiSnapshot {
    const total = this.transactions.length;
    if (total === 0) {
      return {
        txnsPerMin: 0,
        approvedPct: 100,
        inReview: 0,
        held: 0,
        estimatedSavedINR: 0,
        totalTxns: 0,
      };
    }

    const now = Date.now();
    const oneMinAgo = now - 60_000;
    const recentOneMin = this.transactions.filter(
      (t) => new Date(t.timestamp).getTime() >= oneMinAgo
    );
    const txnsPerMin = recentOneMin.length > 0 ? recentOneMin.length : Math.max(1, Math.round(total / 10));

    let approved = 0;
    let inReview = 0;
    let held = 0;
    let estimatedSavedINR = 0;

    for (const tx of this.transactions) {
      if (tx.score.decision === "APPROVED") {
        approved++;
      } else if (tx.score.decision === "REVIEW") {
        inReview++;
      } else if (tx.score.decision === "HELD") {
        held++;
        estimatedSavedINR += tx.amountINR;
      }
    }

    const approvedPct = total > 0 ? (approved / total) * 100 : 0;

    return {
      txnsPerMin,
      approvedPct: Number(approvedPct.toFixed(1)),
      inReview,
      held,
      estimatedSavedINR,
      totalTxns: total,
    };
  }

  /**
   * Aggregate transactions into 1-minute time buckets over the last 15 minutes
   */
  public getTimeSeries(minutes = 15): TimeSeriesPoint[] {
    const points: TimeSeriesPoint[] = [];
    const now = new Date();

    for (let i = minutes - 1; i >= 0; i--) {
      const bucketStart = new Date(now.getTime() - (i + 1) * 60_000);
      const bucketEnd = new Date(now.getTime() - i * 60_000);

      const inBucket = this.transactions.filter((t) => {
        const time = new Date(t.timestamp).getTime();
        return time >= bucketStart.getTime() && time < bucketEnd.getTime();
      });

      const timeStr = bucketEnd.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      if (inBucket.length === 0) {
        points.push({
          time: timeStr,
          fraudProb: 0.05,
          volume: 0,
          heldCount: 0,
          reviewCount: 0,
        });
      } else {
        const avgProb =
          inBucket.reduce((acc, t) => acc + t.score.fraudProbability, 0) / inBucket.length;
        const held = inBucket.filter((t) => t.score.decision === "HELD").length;
        const review = inBucket.filter((t) => t.score.decision === "REVIEW").length;

        points.push({
          time: timeStr,
          fraudProb: Number(avgProb.toFixed(3)),
          volume: inBucket.length,
          heldCount: held,
          reviewCount: review,
        });
      }
    }

    return points;
  }

  /**
   * Seed realistic initial data on startup so dashboard opens with live state
   */
  private seedInitialData() {
    const initialSamples: ScoredTransaction[] = [
      {
        id: "TXN-DEMO-9001",
        timestamp: new Date(Date.now() - 120_000).toISOString(),
        customerId: "CUST-9842",
        channel: "UPI",
        amountINR: 1450,
        merchantCategory: "Food & Dining",
        city: "Bengaluru",
        deviceId: "DEV-82194",
        isNewDevice: false,
        isForeignLocation: false,
        hourOfDay: 14,
        txnsLast10Min: 1,
        score: {
          fraudProbability: 0.04,
          decision: "APPROVED",
          topReasons: [
            "Consistent customer historical spending pattern",
            "Known trusted device fingerprint and verified SIM",
            "Domestic geographical proximity and normal velocity",
          ],
          scorerMode: "mock",
        },
        alertStatus: "APPROVED",
      },
      {
        id: "TXN-DEMO-9002",
        timestamp: new Date(Date.now() - 95_000).toISOString(),
        customerId: "CUST-4105",
        channel: "Card",
        amountINR: 4200,
        merchantCategory: "Groceries",
        city: "Mumbai",
        deviceId: "DEV-11492",
        isNewDevice: false,
        isForeignLocation: false,
        hourOfDay: 14,
        txnsLast10Min: 2,
        score: {
          fraudProbability: 0.08,
          decision: "APPROVED",
          topReasons: [
            "Standard customer spending profile",
            "Known trusted device fingerprint and verified SIM",
            "Verified domestic network IP",
          ],
          scorerMode: "mock",
        },
        alertStatus: "APPROVED",
      },
      {
        id: "TXN-DEMO-9003",
        timestamp: new Date(Date.now() - 60_000).toISOString(),
        customerId: "CUST-7714",
        channel: "NetBanking",
        amountINR: 88500,
        merchantCategory: "Electronics",
        city: "Delhi NCR",
        deviceId: "DEV-99381",
        isNewDevice: true,
        isForeignLocation: false,
        hourOfDay: 23,
        txnsLast10Min: 4,
        score: {
          fraudProbability: 0.58,
          decision: "REVIEW",
          topReasons: [
            "Elevated payment amount: ₹88,500",
            "Unrecognized device login / first-time hardware fingerprint",
            "Rapid frequency burst: 4 transactions in past 10 minutes",
          ],
          scorerMode: "mock",
        },
        alertStatus: "OPEN",
      },
      {
        id: "TXN-DEMO-9004",
        timestamp: new Date(Date.now() - 30_000).toISOString(),
        customerId: "CUST-3021",
        channel: "Card",
        amountINR: 325000,
        merchantCategory: "Crypto / Jewelry",
        city: "Dubai (Foreign)",
        deviceId: "DEV-04912",
        isNewDevice: true,
        isForeignLocation: true,
        hourOfDay: 3,
        txnsLast10Min: 9,
        score: {
          fraudProbability: 0.94,
          decision: "HELD",
          topReasons: [
            "High-value outlier: ₹3,25,000 exceeds typical threshold",
            "Extreme transaction velocity: 9 payments within 10 minutes",
            "Cross-border IP/location anomaly: originating from Dubai (Foreign)",
          ],
          scorerMode: "mock",
        },
        alertStatus: "OPEN",
      },
    ];

    this.transactions = initialSamples;
  }
}

// Global singleton to persist across Next.js dev server hot reloads
const globalForStore = globalThis as unknown as {
  fraudShieldStore?: TransactionStore;
};

export const transactionStore = globalForStore.fraudShieldStore ?? new TransactionStore();

if (process.env.NODE_ENV !== "production") {
  globalForStore.fraudShieldStore = transactionStore;
}
