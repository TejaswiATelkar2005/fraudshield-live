const express = require("express");
const { Firestore } = require("@google-cloud/firestore");
const { BigQuery } = require("@google-cloud/bigquery");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.VERTEX_PROJECT_ID || "fraud-transaction-9b87a";
const LOCATION = process.env.VERTEX_LOCATION || "us-central1";
const ENDPOINT_ID = process.env.VERTEX_ENDPOINT_ID || "";
const BIGQUERY_DATASET = process.env.BIGQUERY_DATASET || "banking_fraud_audit";
const BIGQUERY_TABLE = process.env.BIGQUERY_TABLE || "scored_transactions";

// Cloud Clients (lazy initialized)
let firestore = null;
let bigquery = null;
try {
  firestore = new Firestore({ projectId: PROJECT_ID });
  bigquery = new BigQuery({ projectId: PROJECT_ID });
} catch (err) {
  console.warn("Cloud clients initialization warning:", err.message);
}

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "fraudshield-cloudrun-scorer",
    projectId: PROJECT_ID,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Pub/Sub Push Subscription Endpoint
 * Google Cloud Pub/Sub delivers messages in base64: req.body.message.data
 */
app.post("/pubsub/push", async (req, res) => {
  if (!req.body || !req.body.message) {
    return res.status(400).send("Bad Request: Missing Pub/Sub message");
  }

  try {
    const rawData = Buffer.from(req.body.message.data, "base64").toString("utf-8");
    const txn = JSON.parse(rawData);

    console.log(`[Scoring Service] Ingested txn ${txn.id} for ₹${txn.amountINR} via ${txn.channel}`);

    // 1. Score with Vertex AI (or deterministic fallbacks)
    const score = await scoreWithVertexAI(txn);

    const scoredTxn = {
      ...txn,
      score,
      alertStatus: score.decision === "APPROVED" ? "APPROVED" : "OPEN",
      scoredAt: new Date().toISOString(),
    };

    // 2. Write to Firestore for Real-time Dashboard Sync
    if (firestore) {
      try {
        await firestore.collection("transactions").doc(scoredTxn.id).set(scoredTxn);
      } catch (fsErr) {
        console.warn("[Firestore] Write failed:", fsErr.message);
      }
    }

    // 3. Write to Google BigQuery for compliance audit log
    if (bigquery) {
      try {
        await bigquery
          .dataset(BIGQUERY_DATASET)
          .table(BIGQUERY_TABLE)
          .insert([
            {
              id: scoredTxn.id,
              timestamp: scoredTxn.timestamp,
              customerId: scoredTxn.customerId,
              channel: scoredTxn.channel,
              amountINR: scoredTxn.amountINR,
              city: scoredTxn.city,
              fraudProbability: scoredTxn.score.fraudProbability,
              decision: scoredTxn.score.decision,
              topReasons: JSON.stringify(scoredTxn.score.topReasons),
              scoredAt: scoredTxn.scoredAt,
            },
          ]);
      } catch (bqErr) {
        console.warn("[BigQuery] Streaming insert failed:", bqErr.message);
      }
    }

    // Acknowledge Pub/Sub message with 200 OK
    res.status(200).json({ success: true, txnId: scoredTxn.id, decision: score.decision });
  } catch (err) {
    console.error("[Scoring Service] Error processing message:", err);
    // Return 200 to acknowledge unparseable message so it doesn't loop forever
    res.status(200).send("Message processed with errors");
  }
});

/**
 * Direct REST scoring endpoint
 */
app.post("/score", async (req, res) => {
  try {
    const txn = req.body;
    const score = await scoreWithVertexAI(txn);
    res.status(200).json({ txnId: txn.id, score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function scoreWithVertexAI(txn) {
  // If Vertex AI Endpoint credentials exist, call Google Cloud Vertex AI REST API
  if (PROJECT_ID && ENDPOINT_ID && process.env.VERTEX_AUTH_TOKEN) {
    try {
      const endpointUrl = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/endpoints/${ENDPOINT_ID}:predict`;
      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.VERTEX_AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          instances: [
            {
              amountINR: txn.amountINR,
              channel: txn.channel,
              hourOfDay: txn.hourOfDay || 12,
              isNewDevice: txn.isNewDevice ? 1 : 0,
              isForeignLocation: txn.isForeignLocation ? 1 : 0,
              txnsLast10Min: txn.txnsLast10Min || 1,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const prob = data.predictions?.[0]?.fraud_probability || 0.05;
        let decision = "APPROVED";
        if (prob > 0.7) decision = "HELD";
        else if (prob >= 0.3) decision = "REVIEW";
        return {
          fraudProbability: Number(prob.toFixed(3)),
          decision,
          topReasons: ["Model inference from Vertex AI endpoint"],
          scorerMode: "vertex",
        };
      }
    } catch (err) {
      console.warn("Vertex AI predict call failed, using rule-weighted score:", err.message);
    }
  }

  // Deterministic rule model fallback
  let rawScore = 0.025;
  const reasons = [];

  if (txn.amountINR >= 300000) {
    rawScore += 0.55;
    reasons.push(`High-value outlier: ₹${txn.amountINR.toLocaleString("en-IN")}`);
  } else if (txn.amountINR >= 150000) {
    rawScore += 0.38;
    reasons.push(`High transaction amount: ₹${txn.amountINR.toLocaleString("en-IN")}`);
  } else if (txn.amountINR >= 50000) {
    rawScore += 0.22;
    reasons.push(`Elevated payment amount: ₹${txn.amountINR.toLocaleString("en-IN")}`);
  }

  if (txn.isNewDevice) {
    rawScore += 0.22;
    reasons.push("Unrecognized device login");
  }

  if (txn.isForeignLocation) {
    rawScore += 0.32;
    reasons.push(`Cross-border location anomaly: ${txn.city}`);
  }

  if (txn.txnsLast10Min >= 8) {
    rawScore += 0.45;
    reasons.push(`Extreme velocity: ${txn.txnsLast10Min} txns in 10 mins`);
  }

  const fraudProbability = Math.max(0.01, Math.min(0.99, Number(rawScore.toFixed(3))));
  let decision = "APPROVED";
  if (fraudProbability > 0.7) decision = "HELD";
  else if (fraudProbability >= 0.3) decision = "REVIEW";

  if (reasons.length === 0) {
    reasons.push("Standard verified customer profile");
  }

  return {
    fraudProbability,
    decision,
    topReasons: reasons.slice(0, 3),
    scorerMode: "mock",
  };
}

app.listen(PORT, () => {
  console.log(`FraudShield Cloud Run scoring service listening on port ${PORT}`);
});
