import { describe, it, expect } from "vitest";
import { simulator } from "@/lib/simulator/simulator";

describe("Transaction Simulator", () => {
  it("generates realistic transaction with all required fields", async () => {
    const txn = await simulator.generateAndProcess();

    expect(txn.id).toMatch(/^TXN-/);
    expect(txn.timestamp).toBeDefined();
    expect(txn.customerId).toMatch(/^CUST-\d+/);
    expect(["UPI", "Card", "NetBanking"]).toContain(txn.channel);
    expect(txn.amountINR).toBeGreaterThan(0);
    expect(txn.merchantCategory).toBeTruthy();
    expect(txn.city).toBeTruthy();
    expect(txn.deviceId).toMatch(/^DEV-/);
    expect(typeof txn.isNewDevice).toBe("boolean");
    expect(typeof txn.isForeignLocation).toBe("boolean");
    expect(txn.hourOfDay).toBeGreaterThanOrEqual(0);
    expect(txn.hourOfDay).toBeLessThanOrEqual(23);
    expect(txn.txnsLast10Min).toBeGreaterThanOrEqual(0);
  });

  it("injects a burst of fraudulent transactions", async () => {
    const burstCount = await simulator.injectFraudBurst();

    expect(burstCount).toBeGreaterThanOrEqual(5);
    expect(burstCount).toBeLessThanOrEqual(8);
  });

  it("updates speed interval properly within boundaries", () => {
    simulator.setIntervalMs(1500);
    expect(simulator.getStatus().intervalMs).toBe(1500);

    // Clamps below minimum
    simulator.setIntervalMs(100);
    expect(simulator.getStatus().intervalMs).toBe(500);

    // Clamps above maximum
    simulator.setIntervalMs(20000);
    expect(simulator.getStatus().intervalMs).toBe(10000);

    // Reset to 2000
    simulator.setIntervalMs(2000);
  });
});
