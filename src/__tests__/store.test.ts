import { describe, it, expect } from "vitest";
import { transactionStore } from "@/lib/store/transactionStore";
import type { ScoredTransaction } from "@/lib/types";

describe("Transaction Store & KPI Aggregation", () => {
  it("stores and retrieves transactions", () => {
    const sampleTx: ScoredTransaction = {
      id: "TXN-UNIT-TEST-1",
      timestamp: new Date().toISOString(),
      customerId: "CUST-9999",
      channel: "UPI",
      amountINR: 5000,
      merchantCategory: "Electronics",
      city: "Mumbai",
      deviceId: "DEV-12345",
      isNewDevice: false,
      isForeignLocation: false,
      hourOfDay: 14,
      txnsLast10Min: 1,
      score: {
        fraudProbability: 0.12,
        decision: "APPROVED",
        topReasons: ["Consistent spending pattern"],
        scorerMode: "mock",
      },
      alertStatus: "APPROVED",
    };

    transactionStore.addTransaction(sampleTx);
    const retrieved = transactionStore.getById("TXN-UNIT-TEST-1");

    expect(retrieved).toBeDefined();
    expect(retrieved?.amountINR).toBe(5000);
  });

  it("updates transaction alert resolution with analyst notes", () => {
    const alertTx: ScoredTransaction = {
      id: "TXN-UNIT-ALERT-1",
      timestamp: new Date().toISOString(),
      customerId: "CUST-8888",
      channel: "Card",
      amountINR: 195000,
      merchantCategory: "Crypto / Jewelry",
      city: "Dubai (Foreign)",
      deviceId: "DEV-SUS-1",
      isNewDevice: true,
      isForeignLocation: true,
      hourOfDay: 3,
      txnsLast10Min: 8,
      score: {
        fraudProbability: 0.88,
        decision: "HELD",
        topReasons: ["High amount", "Foreign location"],
        scorerMode: "mock",
      },
      alertStatus: "OPEN",
    };

    transactionStore.addTransaction(alertTx);

    const updated = transactionStore.updateTransaction("TXN-UNIT-ALERT-1", {
      alertStatus: "CONFIRMED_FRAUD",
      analystNote: "Confirmed with cardholder via outbound call; unauthorized foreign charge.",
      analystId: "analyst-viva",
    });

    expect(updated).not.toBeNull();
    expect(updated?.alertStatus).toBe("CONFIRMED_FRAUD");
    expect(updated?.analystNote).toContain("Confirmed with cardholder");
    expect(updated?.analystId).toBe("analyst-viva");
    expect(updated?.resolvedAt).toBeDefined();
  });

  it("calculates real-time KPI metrics", () => {
    const kpi = transactionStore.getKpiSnapshot();

    expect(kpi.totalTxns).toBeGreaterThan(0);
    expect(kpi.approvedPct).toBeGreaterThanOrEqual(0);
    expect(kpi.approvedPct).toBeLessThanOrEqual(100);
    expect(kpi.estimatedSavedINR).toBeGreaterThanOrEqual(0);
  });
});
