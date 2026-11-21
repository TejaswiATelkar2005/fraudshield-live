"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  ShieldCheck,
  Lock,
  Mail,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, quickLogin, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuick = async (role: "analyst" | "admin") => {
    setLoading(true);
    setError(null);
    try {
      await quickLogin(role);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quick login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-cyan-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            FraudShield Operations Portal
          </h1>
          <p className="text-xs text-slate-400">
            Secure analyst authentication & RBAC access control
          </p>
        </div>

        {/* Current status if already logged in */}
        {user && (
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300">
                Currently logged in as: <strong className="text-cyan-300">{user.email}</strong>
              </span>
            </div>
            <button
              onClick={() => router.push("/")}
              className="text-cyan-400 font-semibold hover:underline flex items-center gap-1"
            >
              Go to Dashboard <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Quick Viva Login Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>One-Click Viva Demo Accounts</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQuick("analyst")}
              disabled={loading}
              className="p-3 rounded-xl bg-slate-800/90 border border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-800 text-left transition-all group"
            >
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs mb-1">
                <UserCheck className="w-4 h-4" />
                Senior Analyst
              </div>
              <p className="text-[11px] text-slate-400">analyst@bank.com</p>
              <span className="text-[10px] text-cyan-400/80 mt-1 block group-hover:underline">
                Review & triage alerts →
              </span>
            </button>

            <button
              onClick={() => handleQuick("admin")}
              disabled={loading}
              className="p-3 rounded-xl bg-slate-800/90 border border-purple-500/30 hover:border-purple-400 hover:bg-slate-800 text-left transition-all group"
            >
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs mb-1">
                <ShieldAlert className="w-4 h-4" />
                Fraud Ops Admin
              </div>
              <p className="text-[11px] text-slate-400">admin@bank.com</p>
              <span className="text-[10px] text-purple-400/80 mt-1 block group-hover:underline">
                Full governance & simulator →
              </span>
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-2 text-slate-500 font-medium">Or enter credentials</span>
          </div>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Work Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@bank.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Verifying Credentials…" : "Sign In to Operations Console"}
          </button>
        </form>
      </div>
    </div>
  );
}
