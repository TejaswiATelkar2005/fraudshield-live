import { v4 as uuidv4 } from "uuid";
import type { Transaction, Channel, SimulatorStatus } from "@/lib/types";
import { scoreTransaction } from "@/lib/scoring/scorer";
import { transactionStore } from "@/lib/store/transactionStore";

const CHANNELS: Channel[] = ["UPI", "Card", "NetBanking"];

const NORMAL_MERCHANTS = [
  "Groceries & Supermarket",
  "Food & Dining",
  "Electronics",
  "Fuel & Transport",
  "Utility Bills & Recharges",
  "Healthcare & Pharmacy",
  "Fashion & Apparel",
  "Travel & Airlines",
];

const HIGH_RISK_MERCHANTS = [
  "Crypto / Jewelry",
  "Online Gaming / Casino",
  "Luxury Goods",
  "International Wire",
];

const DOMESTIC_CITIES = [
  "Mumbai",
  "Bengaluru",
  "Delhi NCR",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
];

const FOREIGN_CITIES = [
  "Dubai (Foreign)",
  "London (Foreign)",
  "Singapore (Foreign)",
  "Bangkok (Foreign)",
];

class TransactionSimulator {
  private isRunning = true;
  private intervalMs = 2000;
  private timer: NodeJS.Timeout | null = null;
  private burstActive = false;
  private totalGenerated = 0;
  private lastGeneratedAt?: string;

  constructor() {
    this.start();
  }

  public getStatus(): SimulatorStatus {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      burstActive: this.burstActive,
      scorerMode: (process.env.SCORER_MODE === "vertex" ? "vertex" : "mock") as "mock" | "vertex",
      totalGenerated: this.totalGenerated,
      lastGeneratedAt: this.lastGeneratedAt,
    };
  }

  public start() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.isRunning = true;
    this.timer = setInterval(() => {
      void this.generateAndProcess();
    }, this.intervalMs);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  public setIntervalMs(ms: number) {
    this.intervalMs = Math.max(500, Math.min(10000, ms));
    if (this.isRunning) {
      this.start();
    }
  }

  /**
   * Inject a rapid burst of 5-8 fraudulent transactions
   */
  public async injectFraudBurst(): Promise<number> {
    this.burstActive = true;
    const burstCount = Math.floor(Math.random() * 4) + 5; // 5 to 8
    const burstCustomerId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
    const burstDeviceId = `DEV-${Math.floor(10000 + Math.random() * 90000)}`;

    for (let i = 0; i < burstCount; i++) {
      const isCard = Math.random() > 0.4;
      const txn: Transaction = {
        id: `TXN-BURST-${uuidv4().slice(0, 8).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        customerId: burstCustomerId,
        channel: isCard ? "Card" : "NetBanking",
        amountINR: Math.floor(120000 + Math.random() * 280000), // ₹1.2L to ₹4L
        merchantCategory:
          HIGH_RISK_MERCHANTS[Math.floor(Math.random() * HIGH_RISK_MERCHANTS.length)],
        city: FOREIGN_CITIES[Math.floor(Math.random() * FOREIGN_CITIES.length)],
        deviceId: burstDeviceId,
        isNewDevice: true,
        isForeignLocation: true,
        hourOfDay: Math.random() > 0.5 ? 2 : 3, // 2-3 AM
        txnsLast10Min: 8 + i, // escalating velocity
      };

      const score = await scoreTransaction(txn);
      transactionStore.addTransaction({
        ...txn,
        score,
        alertStatus: "OPEN",
      });

      this.totalGenerated++;
      this.lastGeneratedAt = txn.timestamp;

      // Small delay between burst items
      await new Promise((r) => setTimeout(r, 200));
    }

    this.burstActive = false;
    return burstCount;
  }

  /**
   * Generate a single synthetic payment and run it through the scoring pipeline
   */
  public async generateAndProcess(): Promise<Transaction> {
    // 3% probability of being naturally simulated fraud
    const isFraudLike = Math.random() < 0.035;

    const now = new Date();
    const customerNum = Math.floor(1000 + Math.random() * 9000);
    const customerId = `CUST-${customerNum}`;
    const deviceId = `DEV-${Math.floor(10000 + Math.random() * 90000)}`;
    const channel = CHANNELS[Math.floor(Math.random() * CHANNELS.length)];

    let txn: Transaction;

    if (isFraudLike) {
      // High-risk transaction pattern
      const amountINR = Math.floor(85000 + Math.random() * 250000); // High amount
      const isForeign = Math.random() < 0.85;
      const city = isForeign
        ? FOREIGN_CITIES[Math.floor(Math.random() * FOREIGN_CITIES.length)]
        : DOMESTIC_CITIES[Math.floor(Math.random() * DOMESTIC_CITIES.length)];
      const merchant =
        Math.random() < 0.7
          ? HIGH_RISK_MERCHANTS[Math.floor(Math.random() * HIGH_RISK_MERCHANTS.length)]
          : NORMAL_MERCHANTS[Math.floor(Math.random() * NORMAL_MERCHANTS.length)];

      txn = {
        id: `TXN-${uuidv4().slice(0, 8).toUpperCase()}`,
        timestamp: now.toISOString(),
        customerId,
        channel,
        amountINR,
        merchantCategory: merchant,
        city,
        deviceId,
        isNewDevice: true,
        isForeignLocation: isForeign,
        hourOfDay: Math.floor(Math.random() * 5), // night hours 0-4
        txnsLast10Min: Math.floor(5 + Math.random() * 6), // velocity 5-10
      };
    } else {
      // Normal legitimate banking transaction
      const isSmallUpi = channel === "UPI" && Math.random() < 0.7;
      const amountINR = isSmallUpi
        ? Math.floor(50 + Math.random() * 2500)
        : Math.floor(1000 + Math.random() * 24000);

      const city = DOMESTIC_CITIES[Math.floor(Math.random() * DOMESTIC_CITIES.length)];
      const merchant = NORMAL_MERCHANTS[Math.floor(Math.random() * NORMAL_MERCHANTS.length)];

      txn = {
        id: `TXN-${uuidv4().slice(0, 8).toUpperCase()}`,
        timestamp: now.toISOString(),
        customerId,
        channel,
        amountINR,
        merchantCategory: merchant,
        city,
        deviceId,
        isNewDevice: Math.random() < 0.05,
        isForeignLocation: false,
        hourOfDay: now.getHours(),
        txnsLast10Min: Math.floor(1 + Math.random() * 2),
      };
    }

    const score = await scoreTransaction(txn);
    const alertStatus = score.decision === "APPROVED" ? "APPROVED" : "OPEN";

    transactionStore.addTransaction({
      ...txn,
      score,
      alertStatus,
    });

    this.totalGenerated++;
    this.lastGeneratedAt = txn.timestamp;

    return txn;
  }
}

// Global singleton to persist simulator state across API calls in Next.js
const globalForSim = globalThis as unknown as {
  fraudShieldSimulator?: TransactionSimulator;
};

export const simulator = globalForSim.fraudShieldSimulator ?? new TransactionSimulator();

if (process.env.NODE_ENV !== "production") {
  globalForSim.fraudShieldSimulator = simulator;
}
