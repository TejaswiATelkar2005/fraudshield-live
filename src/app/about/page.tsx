import {
  ShieldCheck,
  BrainCircuit,
  Database,
  Users,
  AlertCircle,
  FileText,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { SimBadge } from "@/components/layout/SimBadge";

export const metadata = {
  title: "About & Viva Docs | FraudShield Live",
  description: "University Case Study CAT-03: Real-Time AI Fraud Detection using Google Cloud Vertex AI",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      {/* Title section */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <SimBadge />
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
            Case Study: CAT-03
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">
          AI-Based Fraud Detection for Digital Banking
        </h1>
        <p className="text-base text-slate-400 mt-2 leading-relaxed">
          Google Cloud Vertex AI Reference Architecture · University Continuous Assessment Task (CAT-03)
        </p>
      </div>

      {/* Human-in-the-Loop Callout */}
      <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/40 p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              The Human-in-the-Loop (HITL) Philosophy
            </h3>
            <blockquote className="mt-2 text-base font-semibold text-cyan-300 italic border-l-2 border-cyan-400 pl-4 py-1">
              “The model assists analysts; final decisions stay with humans.”
            </blockquote>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              In high-stakes retail banking, pure algorithmic black-box blocking alienates loyal customers through false declines, while fully manual review cannot keep pace with 10,000+ payments per second. FraudShield Live uses AI to instantly clear 97% of legitimate traffic, while surfacing borderline and high-risk anomalies to trained analysts with explainable risk factors.
            </p>
          </div>
        </div>
      </div>

      {/* Problem Statement */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-6 shadow-lg space-y-3">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          1. Problem Statement & Background
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          With India’s massive digital payments revolution across UPI (Unified Payments Interface), credit cards, and online net-banking, fraud has evolved beyond simple card cloning into sophisticated multi-vector attacks:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
          <li className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>High-velocity card stuffing and credential stuffing attacks</span>
          </li>
          <li className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>SIM swapping and unrecognized hardware device logins</span>
          </li>
          <li className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Offshore VPN tunneling & cross-border proxy transactions</span>
          </li>
          <li className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Nocturnal timing bursts to evade bank notification hours</span>
          </li>
        </ul>
      </div>

      {/* How the Model Works */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-6 shadow-lg space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-purple-400" />
          2. How the AI Fraud Model Works
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          The scoring service accepts raw transaction events and passes an engineered feature vector into a Vertex AI Online Prediction endpoint running a tuned XGBoost gradient-boosted decision tree ensemble.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="font-semibold text-emerald-400 mb-1">APPROVED (&lt; 0.30)</div>
            <p className="text-slate-400">
              Low-risk payments clear immediately in &lt;150ms with zero customer friction.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="font-semibold text-amber-400 mb-1">REVIEW (0.30 – 0.70)</div>
            <p className="text-slate-400">
              Borderline risk. Triggers step-up 2FA (biometric or OTP) and alert in the analyst queue.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="font-semibold text-rose-400 mb-1">HELD (&gt; 0.70)</div>
            <p className="text-slate-400">
              High-confidence fraud. Transaction is temporarily blocked to protect funds.
            </p>
          </div>
        </div>

        <div className="pt-2 text-xs text-slate-400 border-t border-slate-700/60">
          <strong className="text-slate-200">Explainable AI (XAI):</strong> For every flagged transaction, the model generates the top 3 contributing factors (e.g. <em>“Unrecognized device login”</em>, <em>“Cross-border foreign location”</em>, <em>“Rapid frequency burst: 8 txns in 10 mins”</em>) to satisfy regulatory audit requirements and empower fast human decision-making.
        </div>
      </div>

      {/* Dataset & Privacy Note */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-6 shadow-lg space-y-3">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          3. Synthetic Dataset & Privacy Compliance
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          In compliance with banking privacy regulations (RBI Master Directions and DPDP Act 2023), this application uses <strong>100% synthetic simulation data</strong>:
        </p>
        <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
          <li>Statistically modeled after the standard ULB Machine Learning Group Credit Card Fraud benchmark dataset.</li>
          <li>Synthetically augmented with digital banking payment rails (UPI handles, Cards, and NetBanking).</li>
          <li>All customer IDs are masked in the UI (<code className="text-cyan-400 font-mono">CUST-****4892</code>).</li>
          <li>Zero real currency, account numbers, or personally identifiable information (PII) are stored or transmitted.</li>
        </ul>
      </div>

      {/* GCP Technical Stack Summary */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-6 shadow-lg space-y-3">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Lock className="w-5 h-5 text-indigo-400" />
          4. Google Cloud Platform (GCP) Implementation
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-slate-200">Cloud Pub/Sub</div>
            <div className="text-slate-400 text-[11px] mt-0.5">Event Streaming</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-slate-200">Cloud Run</div>
            <div className="text-slate-400 text-[11px] mt-0.5">Scoring Service</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-slate-200">Vertex AI</div>
            <div className="text-slate-400 text-[11px] mt-0.5">Online Prediction</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="font-bold text-slate-200">BigQuery</div>
            <div className="text-slate-400 text-[11px] mt-0.5">Warehouse Audit</div>
          </div>
        </div>
      </div>
    </div>
  );
}
