"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Radio,
  Server,
  BrainCircuit,
  Database,
  LayoutDashboard,
  Play,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";

interface PipelineStage {
  id: number;
  key: string;
  name: string;
  gcpService: string;
  role: string;
  description: string;
  sampleData: string;
  latencyMs: number;
  icon: React.ElementType;
  badgeColor: string;
}

const STAGES: PipelineStage[] = [
  {
    id: 1,
    key: "customer",
    name: "Customer Payment",
    gcpService: "Payment Gateway / SDK",
    role: "Transaction Ingress",
    description: "Customer initiates payment via UPI, Credit/Debit Card, or NetBanking. Captures amount, channel, device fingerprint, and IP location.",
    sampleData: JSON.stringify(
      {
        channel: "UPI",
        amountINR: 185000,
        merchantCategory: "Electronics",
        city: "Dubai (Foreign)",
        isNewDevice: true,
        isForeignLocation: true,
        txnsLast10Min: 7,
      },
      null,
      2
    ),
    latencyMs: 15,
    icon: CreditCard,
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  },
  {
    id: 2,
    key: "pubsub",
    name: "Google Cloud Pub/Sub",
    gcpService: "Cloud Pub/Sub",
    role: "Decoupled Event Stream",
    description: "High-throughput message bus buffering transactions with sub-10ms delivery. Eliminates backpressure on banking core systems.",
    sampleData: JSON.stringify(
      {
        messageId: "pubsub-msg-98421049",
        publishTime: "2026-11-21T16:45:00.120Z",
        topic: "projects/fraudshield-gcp/topics/banking-txns",
        attributes: { routingKey: "priority-scoring" },
      },
      null,
      2
    ),
    latencyMs: 12,
    icon: Radio,
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  },
  {
    id: 3,
    key: "cloudrun",
    name: "Cloud Run Service",
    gcpService: "Cloud Run Microservice",
    role: "Feature Extraction & Orchestration",
    description: "Auto-scaling serverless container listening to Pub/Sub pull subscriptions. Prepares numerical feature tensors and computes velocity metrics.",
    sampleData: JSON.stringify(
      {
        service: "fraudshield-scorer-service",
        containerRevision: "cloud-run-v1.4",
        featuresPrepared: 11,
        activeReplicas: 4,
      },
      null,
      2
    ),
    latencyMs: 22,
    icon: Server,
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
  },
  {
    id: 4,
    key: "vertexai",
    name: "Vertex AI Endpoint",
    gcpService: "Google Cloud Vertex AI",
    role: "ML Fraud Scoring Engine",
    description: "Online prediction endpoint running an ensemble XGBoost / Neural Net classifier. Returns fraud probability in [0, 1] + SHAP feature attributions.",
    sampleData: JSON.stringify(
      {
        endpoint: "projects/gcp-demo/locations/us-central1/endpoints/4921",
        model: "fraud-detector-xgboost-v3",
        fraudProbability: 0.892,
        decision: "HELD",
        topReasons: [
          "Amount 8x customer average",
          "Cross-border IP location",
          "Rapid velocity burst (7 txns)",
        ],
      },
      null,
      2
    ),
    latencyMs: 48,
    icon: BrainCircuit,
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  },
  {
    id: 5,
    key: "bigquery",
    name: "Google BigQuery",
    gcpService: "BigQuery Streaming Ingestion",
    role: "Analytics & Compliance Audit Log",
    description: "Streamed via BigQuery Storage Write API for real-time aggregation, regulatory compliance, model drift monitoring, and retrospective analytics.",
    sampleData: JSON.stringify(
      {
        dataset: "banking_audit.fraud_scored_stream",
        writeApi: "StorageWriteAPI.Committed",
        partitionKey: "20261121",
        retainedDays: 730,
      },
      null,
      2
    ),
    latencyMs: 35,
    icon: Database,
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  },
  {
    id: 6,
    key: "dashboard",
    name: "Analyst Dashboard",
    gcpService: "Next.js + SSE / Firestore",
    role: "Human-in-the-Loop Review",
    description: "Real-time SSE push pushes flagged REVIEW and HELD transactions to analyst consoles for 2FA step-up verification or block confirmation.",
    sampleData: JSON.stringify(
      {
        sseConnection: "active",
        alertId: "ALERT-TXN-BURST-819",
        triageStatus: "OPEN",
        recommendedAction: "STEP_UP_2FA",
      },
      null,
      2
    ),
    latencyMs: 8,
    icon: LayoutDashboard,
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  },
];

export default function ArchitecturePage() {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedStage, setSelectedStage] = useState<PipelineStage>(STAGES[3]); // Default to Vertex AI
  const [totalPipelineLatency, setTotalPipelineLatency] = useState(0);

  const runAnimation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    let runningLatency = 0;

    for (let i = 1; i <= STAGES.length; i++) {
      setActiveStage(i);
      const stage = STAGES[i - 1];
      setSelectedStage(stage);
      runningLatency += stage.latencyMs;
      setTotalPipelineLatency(runningLatency);
      await new Promise((resolve) => setTimeout(resolve, 850));
    }

    setTimeout(() => {
      setIsSimulating(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Header with viva CTA */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              University Case Study · CAT-03
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 mt-2">
            End-to-End System Architecture
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time event-driven transaction processing pipeline powered by Google Cloud Vertex AI, Pub/Sub, Cloud Run, and BigQuery.
          </p>
        </div>

        <button
          onClick={runAnimation}
          disabled={isSimulating}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50"
        >
          <Play className={`w-4 h-4 fill-white ${isSimulating ? "animate-spin" : ""}`} />
          {isSimulating ? `Packet in Stage ${activeStage} of 6…` : "Simulate End-to-End Flow"}
        </button>
      </div>

      {/* Latency & Pipeline Health Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>End-to-End Latency</span>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {totalPipelineLatency > 0 ? `${totalPipelineLatency} ms` : "140 ms"}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">✓ Well within 500ms SLA</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>ML Inference Speed</span>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">48 ms</div>
          <div className="text-[11px] text-slate-400 mt-1">Vertex AI Online Predict</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Radio className="w-4 h-4 text-indigo-400" />
            <span>Streaming Bus</span>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">Pub/Sub</div>
          <div className="text-[11px] text-cyan-400 mt-1">Zero message loss buffer</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Governance</span>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">HITL</div>
          <div className="text-[11px] text-amber-400 mt-1">Human-in-the-Loop review</div>
        </div>
      </div>

      {/* 6-Stage Interactive Visual Flow */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-200">
            Pipeline Stages (Click any stage to inspect payload)
          </h2>
          {isSimulating && (
            <span className="flex items-center gap-1.5 text-xs text-cyan-400 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              Transaction packet travelling through live stages
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STAGES.map((stage) => {
            const Icon = stage.icon;
            const isCurrentlyActive = activeStage === stage.id;
            const isSelected = selectedStage.id === stage.id;

            return (
              <div
                key={stage.id}
                onClick={() => setSelectedStage(stage)}
                className={`relative rounded-xl p-5 border cursor-pointer transition-all duration-300 text-left ${
                  isCurrentlyActive
                    ? "bg-cyan-950/40 border-cyan-400 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-500 scale-[1.02]"
                    : isSelected
                    ? "bg-slate-800 border-cyan-500/60 shadow-lg"
                    : "bg-slate-800/60 border-slate-700/70 hover:border-slate-600 hover:bg-slate-800/80"
                }`}
              >
                {/* Stage number & status badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700 font-mono text-xs font-bold text-slate-200">
                      {stage.id}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${stage.badgeColor}`}>
                      {stage.gcpService}
                    </span>
                  </div>

                  {isCurrentlyActive ? (
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-500">~{stage.latencyMs}ms</span>
                  )}
                </div>

                {/* Stage Name */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-slate-700/60 text-cyan-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{stage.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">{stage.role}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mt-2">
                  {stage.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <selectedStage.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400">STAGE {selectedStage.id}</span>
                <span className="text-slate-600">·</span>
                <span className="text-xs font-semibold text-cyan-400">{selectedStage.gcpService}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-100">{selectedStage.name}</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-mono text-slate-300">
              Latency: <span className="text-cyan-400 font-semibold">{selectedStage.latencyMs} ms</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Architecture & Viva Talking Points
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedStage.description}
              </p>
            </div>

            <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4 space-y-2 text-xs">
              <div className="font-semibold text-slate-200">Key Architectural Advantage:</div>
              <p className="text-slate-400">
                {selectedStage.id === 1 && "Multi-channel normalization: standardizes UPI VPAs, EMV card payloads, and NetBanking session hashes into a uniform feature schema."}
                {selectedStage.id === 2 && "Decouples peak transaction surges (e.g. Diwali sales) so downstream ML scoring endpoints never drop transactions."}
                {selectedStage.id === 3 && "Stateless horizontal scaling from 0 to 100+ container instances with sub-second cold starts using Google Cloud Run."}
                {selectedStage.id === 4 && "Enterprise ML serving with zero downtime model redeployment, canary testing, and automated feature attribution (SHAP values)."}
                {selectedStage.id === 5 && "Sub-second analytical queries across millions of transactions with columnar BigQuery storage and partitioned tables."}
                {selectedStage.id === 6 && "Prevents customer friction: low-risk payments are approved in under 150ms while suspicious transactions are triaged by analysts."}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Data Payload at this Stage
              </h4>
              <span className="text-[11px] font-mono text-slate-500">JSON schema</span>
            </div>
            <pre className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-64 shadow-inner">
              {selectedStage.sampleData}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
