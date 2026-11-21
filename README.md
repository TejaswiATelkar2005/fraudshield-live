# FraudShield Live: Real-Time AI Fraud Detection Dashboard

> **University Case Study (CAT-03):** *AI-Based Fraud Detection for Digital Banking using Google Cloud Vertex AI*  
> **Simulation Notice:** All transactions, customer identifiers, and account balances are 100% synthetic simulated data. Zero real financial data or live bank accounts are used.

---

## 📌 Executive Summary & Architecture

Modern digital banking systems in India (handling UPI, EMV Cards, and NetBanking) operate under strict millisecond SLAs. Traditional rule engines either cause high false decline rates (frustrating legitimate users) or miss sophisticated cross-border, high-velocity attacks.

**FraudShield Live** mirrors an enterprise event-driven cloud architecture on **Google Cloud Platform (GCP)**:

```
[ Customer Payment ]
   │ (UPI, Card, NetBanking)
   ▼
[ Cloud Pub/Sub ]  ──▶ High-throughput decoupled ingestion buffer
   │
   ▼
[ Cloud Run Service ] ──▶ Stateless containerized scoring microservice
   │
   ├──▶ [ Vertex AI Endpoint ] ──▶ XGBoost classifier (fraudProbability 0..1 + SHAP top reasons)
   │
   ├──▶ [ Google BigQuery ] ──▶ Historical audit log & compliance data warehouse
   │
   ▼
[ Analyst Dashboard ] ──▶ Server-Sent Events (SSE) / Firestore real-time alerting & Human-in-the-Loop review
```

### Human-in-the-Loop (HITL) Philosophy
> **“The model assists analysts; final decisions stay with humans.”**

- **APPROVED (`< 0.30`)**: Instant automated frictionless clearance (<150ms).
- **REVIEW (`0.30 – 0.70`)**: Step-up 2FA challenge triggered; transaction flagged to analysts with explainable risk reasons.
- **HELD (`> 0.70`)**: High-confidence anomaly; funds held pending human verification.

---

## 🚀 Features (Phase 1)

1. **Live Monitor (Home)**:
   - Real-time KPIs: Transactions/min, Approved %, In Review count, Held count, Estimated Amount Saved in INR (₹).
   - Live streaming transaction feed with color-coded and labeled risk badges.
   - Real-time 15-minute time series chart showing fraud probability and transaction volume.
   - Decision distribution donut chart.
2. **Alerts Queue (`/alerts`)**:
   - Filterable & sortable table of `REVIEW` and `HELD` transactions.
   - Slide-over detail drawer with 180° radial fraud probability gauge.
   - Top 3 explainable risk factors (e.g. *“New device + foreign location + amount 8x customer average”*).
   - Analyst triage actions: **Approve**, **Confirm Fraud**, and **False Alarm** with analyst notes and timestamps.
3. **Stream Simulator Panel (`/simulator`)**:
   - Configurable traffic generator (0.5s to 5.0s cadence).
   - Pause / Resume controls and +1 manual tick generator.
   - **⚡ Inject Fraud Burst** button to simulate rapid credential stuffing attacks.
4. **Animated Architecture Demo (`/architecture`)**:
   - Interactive 6-stage pipeline animation for university viva presentations.
   - Packet inspector showing JSON payloads across Pub/Sub, Cloud Run, Vertex AI, BigQuery, and the Dashboard.
5. **Analytics Deep-Dive (`/analytics`)**:
   - Hourly fraud probability breakdown (showing nocturnal 23:00–04:00 risk surge).
   - Vulnerability breakdown by channel (UPI vs Card vs NetBanking).
   - Geolocation risk hotspots (Domestic vs Offshore IP ingress).
   - Analyst feedback precision and false alarm metrics.
6. **Case Study & Viva Docs (`/about`)**:
   - Comprehensive problem statement, technical stack overview, anonymization policy, and model mechanics.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict mode, zero `any`)
- **Styling**: Tailwind CSS, Lucide Icons, Radix UI primitives
- **Visualizations**: Recharts (ComposedChart, BarChart, PieChart, Donut)
- **Real-Time Delivery**: Server-Sent Events (SSE) via `/api/stream`
- **Validation**: Zod runtime schema validation + sliding-window rate limiting
- **Testing**: Vitest with unit tests for scoring engine, decision thresholds, and stores

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js 20+ installed
- `pnpm` (or `npm`)

### 1. Installation
```bash
cd fraudshield-live
pnpm install
```

### 2. Environment Setup
Phase 1 works out of the box with zero external cloud dependencies using `SCORER_MODE=mock`:

```bash
# Copy example environment configuration
cp .env.example .env.local
```

Default `.env.local` contents:
```ini
SCORER_MODE=mock
PORT=3000
```

### 3. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Unit Tests & Type Check
```bash
# Run unit test suite
pnpm test

# Run strict TypeScript compiler verification
pnpm type-check

# Run production build
pnpm build
```

---

## 🔄 Switching to Google Cloud Vertex AI (`SCORER_MODE=vertex`)

When you are ready to connect to your live Google Cloud Vertex AI endpoint:

1. Deploy your trained model to a Vertex AI Endpoint:
   ```bash
   gcloud ai endpoints list --region=us-central1
   ```
2. Update your `.env.local`:
   ```ini
   SCORER_MODE=vertex
   VERTEX_PROJECT_ID="your-gcp-project-id"
   VERTEX_LOCATION="us-central1"
   VERTEX_ENDPOINT_ID="your-vertex-endpoint-id"
   VERTEX_AUTH_TOKEN="your-gcloud-auth-print-access-token"
   ```
3. Restart the Next.js server (`pnpm dev`). If the Vertex AI endpoint is ever unreachable, the app automatically logs a warning and falls back to rule-weighted scoring so the dashboard never breaks.

---

## ☁️ Cloud Deployment (Phase 3 Architecture Reference)

### Deploying the Dashboard to Google Cloud Run
```bash
# Build container image with Google Cloud Build
gcloud builds submit --tag gcr.io/$PROJECT_ID/fraudshield-dashboard

# Deploy to Cloud Run
gcloud run deploy fraudshield-dashboard \
  --image gcr.io/$PROJECT_ID/fraudshield-dashboard \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SCORER_MODE=mock
```

### Pub/Sub Topic Setup
```bash
gcloud pubsub topics create banking-transactions
gcloud pubsub subscriptions create scoring-worker-sub --topic=banking-transactions
```

### BigQuery Audit Dataset Setup
```bash
bq --location=US mk --dataset $PROJECT_ID:banking_fraud_audit
```

---

## 🎭 4-Step Viva Demonstration Script

Follow this 4-step script for an impressive live presentation:

### Step 1: Normal Legitimate Transaction Flow
1. Navigate to **Live Monitor** (`/`).
2. Point out the real-time pulsing connection badge and live KPI cards.
3. Show incoming low-value UPI/Card payments (< ₹5,000) tagged with the green **APPROVED** badge.
4. Explain to the examiner that 97% of transactions clear in under 150ms with zero customer friction.

### Step 2: Suspicious Borderline Anomaly (REVIEW)
1. Point to a yellow **REVIEW** badge in the feed (or navigate to `/alerts`).
2. Open the alert drawer to inspect the transaction.
3. Show the **Risk Factors**: e.g., *“Unrecognized device login”* + *“Elevated payment amount: ₹65,000”*.
4. Explain how this triggers a 2FA step-up biometric prompt on the customer’s phone rather than a flat decline.

### Step 3: Fraud Burst Attack Simulation
1. Click the **“⚡ Inject Fraud Burst”** button directly on the Live Monitor header (or from `/simulator`).
2. Watch the 15-minute line chart immediately spike in fraud probability.
3. Watch the Donut chart slice for **HELD** expand and the feed turn red.
4. Explain that this simulates an automated card-stuffing bot originating from offshore IPs (e.g. Dubai, London) at 03:00 AM.

### Step 4: Human-in-the-Loop Analyst Resolution
1. Click the **Alerts** button in the header or sidebar to open the **Alerts Queue** (`/alerts`).
2. Select one of the newly generated HELD alerts.
3. Show the 180° radial risk gauge reading >90%.
4. Review the top 3 explainable reasons:
   - *High-value outlier (> ₹2,50,000)*
   - *Cross-border IP location*
   - *Extreme transaction velocity (>8 txns in 10 mins)*
5. Enter an analyst note: *"Cardholder contacted; confirmed card skimming attack. Blocked card and notified cyber cell."*
6. Click **Confirm Fraud**. Show how the alert status updates to Confirmed and the Est. Saved KPI updates.
