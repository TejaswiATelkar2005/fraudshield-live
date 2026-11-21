import type { Transaction, TransactionScore, Decision } from "@/lib/types";

export interface ScorerOptions {
  mode?: "mock" | "vertex";
  projectId?: string;
  location?: string;
  endpointId?: string;
  authToken?: string;
}

/**
 * Unified Scoring Interface:
 * scoreTransaction(txn: Transaction) -> Promise<TransactionScore>
 */
export async function scoreTransaction(
  txn: Transaction,
  options?: ScorerOptions
): Promise<TransactionScore> {
  const startTime = Date.now();
  const mode = options?.mode ?? (process.env.SCORER_MODE === "vertex" ? "vertex" : "mock");

  if (mode === "vertex") {
    try {
      const vertexScore = await scoreWithVertexAI(txn, options);
      return {
        ...vertexScore,
        latencyMs: Date.now() - startTime,
        scorerMode: "vertex",
      };
    } catch (err) {
      console.warn(
        `[Scorer] Vertex AI prediction failed, falling back to rule-weighted mock score:`,
        err instanceof Error ? err.message : String(err)
      );
      // Fallback to mock scoring with fallback notification
      const fallback = calculateMockScore(txn);
      return {
        ...fallback,
        latencyMs: Date.now() - startTime,
        scorerMode: "mock",
        topReasons: [
          ...fallback.topReasons.slice(0, 2),
          "Fallback model (Vertex AI endpoint unreachable / offline)",
        ],
      };
    }
  }

  // Default: rule-weighted deterministic mock model
  const mockScore = calculateMockScore(txn);
  return {
    ...mockScore,
    latencyMs: Date.now() - startTime,
    scorerMode: "mock",
  };
}

/**
 * Deterministic rule-weighted scoring model simulating an XGBoost / LightGBM
 * binary classifier trained on digital payments & card transactions.
 */
export function calculateMockScore(txn: Transaction): {
  fraudProbability: number;
  decision: Decision;
  topReasons: string[];
} {
  const scoredFactors: { factor: string; weight: number }[] = [];

  // Base prior risk for retail digital banking: ~2.5%
  let rawScore = 0.025;

  // 1. Transaction Amount Analysis (in INR)
  if (txn.amountINR >= 300000) {
    const weight = 0.55;
    rawScore += weight;
    scoredFactors.push({
      factor: `High-value outlier: ₹${txn.amountINR.toLocaleString("en-IN")} exceeds typical threshold`,
      weight,
    });
  } else if (txn.amountINR >= 150000) {
    const weight = 0.38;
    rawScore += weight;
    scoredFactors.push({
      factor: `High transaction amount (₹${txn.amountINR.toLocaleString("en-IN")})`,
      weight,
    });
  } else if (txn.amountINR >= 50000) {
    const weight = 0.22;
    rawScore += weight;
    scoredFactors.push({
      factor: `Elevated payment amount: ₹${txn.amountINR.toLocaleString("en-IN")}`,
      weight,
    });
  } else if (txn.amountINR < 2000) {
    // Micro-transactions usually carry lower risk unless velocity is high
    rawScore -= 0.01;
  }

  // 2. Device Fingerprint Anomaly
  if (txn.isNewDevice) {
    const weight = 0.22;
    rawScore += weight;
    scoredFactors.push({
      factor: "Unrecognized device login / first-time hardware fingerprint",
      weight,
    });
  }

  // 3. Geolocation & Cross-Border Anomaly
  if (txn.isForeignLocation) {
    const weight = 0.32;
    rawScore += weight;
    scoredFactors.push({
      factor: `Cross-border IP/location anomaly: originating from ${txn.city}`,
      weight,
    });
  }

  // 4. Temporal / Circadian Analysis (Late Night Risk)
  const isNightHour = txn.hourOfDay >= 23 || txn.hourOfDay <= 4;
  if (isNightHour) {
    const weight = 0.18;
    rawScore += weight;
    scoredFactors.push({
      factor: `Off-hours nocturnal transaction timing (${txn.hourOfDay}:00 IST)`,
      weight,
    });
  }

  // 5. Velocity / Frequency Burst (Last 10 minutes)
  if (txn.txnsLast10Min >= 8) {
    const weight = 0.45;
    rawScore += weight;
    scoredFactors.push({
      factor: `Extreme transaction velocity: ${txn.txnsLast10Min} payments within 10 minutes`,
      weight,
    });
  } else if (txn.txnsLast10Min >= 4) {
    const weight = 0.25;
    rawScore += weight;
    scoredFactors.push({
      factor: `Rapid frequency burst: ${txn.txnsLast10Min} transactions in past 10 minutes`,
      weight,
    });
  }

  // 6. High-Risk Merchant Category
  const highRiskCategories = [
    "Crypto / Jewelry",
    "Luxury Goods",
    "International Wire",
    "Online Gaming / Casino",
  ];
  if (highRiskCategories.includes(txn.merchantCategory)) {
    const weight = 0.16;
    rawScore += weight;
    scoredFactors.push({
      factor: `High-risk merchant industry category: ${txn.merchantCategory}`,
      weight,
    });
  }

  // 7. Small deterministic / stochastic variance (±0.03) to simulate model variance
  // Seed with transaction ID hash so it is consistent for the same ID
  const seed = hashString(txn.id);
  const pseudoNoise = ((seed % 1000) / 1000 - 0.5) * 0.06;
  rawScore += pseudoNoise;

  // Clamp probability between 0.01 and 0.99
  const fraudProbability = Math.max(0.01, Math.min(0.99, Number(rawScore.toFixed(4))));

  // Sort contributing risk factors by highest weight
  scoredFactors.sort((a, b) => b.weight - a.weight);

  let topReasons: string[] = scoredFactors.slice(0, 3).map((f) => f.factor);

  // If transaction is safe/approved and has few risk factors, provide positive baseline reasons
  if (topReasons.length === 0) {
    topReasons = [
      "Consistent customer historical spending pattern",
      "Known trusted device fingerprint and verified SIM",
      "Domestic geographical proximity and normal velocity",
    ];
  } else if (topReasons.length < 3) {
    if (!txn.isForeignLocation) {
      topReasons.push("Verified domestic network IP");
    }
    if (!txn.isNewDevice) {
      topReasons.push("Recognized registered customer device");
    }
  }

  // Decision Rules:
  // < 0.30 = APPROVED
  // 0.30 - 0.70 = REVIEW (Step-up verification)
  // > 0.70 = HELD
  let decision: Decision;
  if (fraudProbability < 0.3) {
    decision = "APPROVED";
  } else if (fraudProbability <= 0.7) {
    decision = "REVIEW";
  } else {
    decision = "HELD";
  }

  return {
    fraudProbability,
    decision,
    topReasons: topReasons.slice(0, 3),
  };
}

/**
 * Call Google Cloud Vertex AI Endpoint Predict API
 */
async function scoreWithVertexAI(
  txn: Transaction,
  options?: ScorerOptions
): Promise<{
  fraudProbability: number;
  decision: Decision;
  topReasons: string[];
}> {
  const projectId = options?.projectId ?? process.env.VERTEX_PROJECT_ID;
  const location = options?.location ?? process.env.VERTEX_LOCATION ?? "us-central1";
  const endpointId = options?.endpointId ?? process.env.VERTEX_ENDPOINT_ID;
  const authToken = options?.authToken ?? process.env.VERTEX_AUTH_TOKEN;

  if (!projectId || !endpointId) {
    throw new Error(
      "Missing Vertex AI credentials. Set VERTEX_PROJECT_ID and VERTEX_ENDPOINT_ID."
    );
  }

  const endpointUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/endpoints/${endpointId}:predict`;

  const payload = {
    instances: [
      {
        channel: txn.channel,
        amountINR: txn.amountINR,
        merchantCategory: txn.merchantCategory,
        city: txn.city,
        isNewDevice: txn.isNewDevice ? 1 : 0,
        isForeignLocation: txn.isForeignLocation ? 1 : 0,
        hourOfDay: txn.hourOfDay,
        txnsLast10Min: txn.txnsLast10Min,
      },
    ],
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(endpointUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vertex AI API error (${response.status}): ${errorText}`);
  }

  interface VertexPredictResponse {
    predictions: Array<
      | number
      | { probability?: number; fraud_probability?: number; score?: number; reasons?: string[] }
    >;
  }

  const data = (await response.json()) as VertexPredictResponse;

  if (!data.predictions || data.predictions.length === 0) {
    throw new Error("Invalid response format from Vertex AI: empty predictions array");
  }

  const pred = data.predictions[0];
  let probability = 0.05;
  let reasons: string[] = [];

  if (typeof pred === "number") {
    probability = pred;
  } else if (typeof pred === "object" && pred !== null) {
    probability =
      pred.fraud_probability ?? pred.probability ?? pred.score ?? 0.05;
    if (Array.isArray(pred.reasons)) {
      reasons = pred.reasons;
    }
  }

  const fraudProbability = Math.max(0.01, Math.min(0.99, Number(probability.toFixed(4))));

  let decision: Decision;
  if (fraudProbability < 0.3) {
    decision = "APPROVED";
  } else if (fraudProbability <= 0.7) {
    decision = "REVIEW";
  } else {
    decision = "HELD";
  }

  if (reasons.length === 0) {
    // Generate explainability reasons from features
    const mock = calculateMockScore(txn);
    reasons = mock.topReasons;
  }

  return {
    fraudProbability,
    decision,
    topReasons: reasons.slice(0, 3),
  };
}

/**
 * Simple hash helper for consistent pseudo-noise
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
