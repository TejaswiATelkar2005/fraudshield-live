import { describe, it, expect } from "vitest";
import { calculateMockScore, scoreTransaction } from "@/lib/scoring/scorer";
import type { Transaction } from "@/lib/types";

describe("Scoring Engine - Rule-Weighted Model & Decision Thresholds", () => {
  it("classifies normal retail transaction as APPROVED (probability < 0.30)", async () => {
    const normalTxn: Transaction = {
      id: "TXN-TEST-001",
      timestamp: new Date().toISOString(),
      customerId: "CUST-1001",
      channel: "UPI",
      amountINR: 450,
      merchantCategory: "Food & Dining",
      city: "Bengaluru",
      deviceId: "DEV-TRUSTED-1",
      isNewDevice: false,
      isForeignLocation: false,
      hourOfDay: 15, // 3 PM
      txnsLast10Min: 1,
    };

    const score = await scoreTransaction(normalTxn);

    expect(score.decision).toBe("APPROVED");
    expect(score.fraudProbability).toBeLessThan(0.3);
    expect(score.fraudProbability).toBeGreaterThanOrEqual(0.01);
    expect(score.topReasons.length).toBeGreaterThan(0);
  });

  it("classifies borderline suspicious transaction as REVIEW (0.30 <= probability <= 0.70)", async () => {
    const suspiciousTxn: Transaction = {
      id: "TXN-TEST-002",
      timestamp: new Date().toISOString(),
      customerId: "CUST-2002",
      channel: "NetBanking",
      amountINR: 65000,
      merchantCategory: "Electronics",
      city: "Mumbai",
      deviceId: "DEV-NEW-88",
      isNewDevice: true, // +0.22
      isForeignLocation: false,
      hourOfDay: 14,
      txnsLast10Min: 2,
    };

    const score = await scoreTransaction(suspiciousTxn);

    expect(score.decision).toBe("REVIEW");
    expect(score.fraudProbability).toBeGreaterThanOrEqual(0.3);
    expect(score.fraudProbability).toBeLessThanOrEqual(0.7);
    expect(score.topReasons.some((r) => r.toLowerCase().includes("device") || r.toLowerCase().includes("amount"))).toBe(true);
  });

  it("classifies composite extreme risk anomaly as HELD (probability > 0.70)", async () => {
    const extremeFraudTxn: Transaction = {
      id: "TXN-TEST-003",
      timestamp: new Date().toISOString(),
      customerId: "CUST-3003",
      channel: "Card",
      amountINR: 350000, // +0.55
      merchantCategory: "Crypto / Jewelry", // +0.16
      city: "Dubai (Foreign)",
      deviceId: "DEV-UNKNOWN-99",
      isNewDevice: true, // +0.22
      isForeignLocation: true, // +0.32
      hourOfDay: 3, // 3 AM night hour: +0.18
      txnsLast10Min: 9, // +0.45
    };

    const score = await scoreTransaction(extremeFraudTxn);

    expect(score.decision).toBe("HELD");
    expect(score.fraudProbability).toBeGreaterThan(0.7);
    expect(score.topReasons.length).toBeLessThanOrEqual(3);
    expect(score.topReasons.some((r) => r.toLowerCase().includes("high") || r.toLowerCase().includes("velocity") || r.toLowerCase().includes("cross-border"))).toBe(true);
  });

  it("keeps fraud probability strictly bounded between 0.01 and 0.99", () => {
    const maxAnomaly: Transaction = {
      id: "TXN-TEST-BOUND-MAX",
      timestamp: new Date().toISOString(),
      customerId: "CUST-9999",
      channel: "Card",
      amountINR: 9999999,
      merchantCategory: "Crypto / Jewelry",
      city: "London (Foreign)",
      deviceId: "DEV-NEW-1",
      isNewDevice: true,
      isForeignLocation: true,
      hourOfDay: 2,
      txnsLast10Min: 50,
    };

    const maxResult = calculateMockScore(maxAnomaly);
    expect(maxResult.fraudProbability).toBeLessThanOrEqual(0.99);
    expect(maxResult.fraudProbability).toBeGreaterThanOrEqual(0.01);

    const minAnomaly: Transaction = {
      id: "TXN-TEST-BOUND-MIN",
      timestamp: new Date().toISOString(),
      customerId: "CUST-0001",
      channel: "UPI",
      amountINR: 10,
      merchantCategory: "Groceries & Supermarket",
      city: "Delhi NCR",
      deviceId: "DEV-OLD",
      isNewDevice: false,
      isForeignLocation: false,
      hourOfDay: 12,
      txnsLast10Min: 1,
    };

    const minResult = calculateMockScore(minAnomaly);
    expect(minResult.fraudProbability).toBeGreaterThanOrEqual(0.01);
    expect(minResult.decision).toBe("APPROVED");
  });

  it("falls back gracefully when Vertex AI mode is requested without cloud credentials", async () => {
    const txn: Transaction = {
      id: "TXN-TEST-VERTEX-FALLBACK",
      timestamp: new Date().toISOString(),
      customerId: "CUST-4004",
      channel: "UPI",
      amountINR: 1200,
      merchantCategory: "Food & Dining",
      city: "Pune",
      deviceId: "DEV-1",
      isNewDevice: false,
      isForeignLocation: false,
      hourOfDay: 11,
      txnsLast10Min: 1,
    };

    // Request vertex mode explicitly without valid endpoint
    const score = await scoreTransaction(txn, { mode: "vertex", endpointId: "invalid-id" });

    // Should not throw, should return fallback mock score with reason indicating fallback
    expect(score).toBeDefined();
    expect(score.decision).toBe("APPROVED");
    expect(score.topReasons.some((r) => r.includes("Fallback"))).toBe(true);
  });
});
