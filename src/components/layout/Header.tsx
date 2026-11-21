"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { SimBadge } from "@/components/layout/SimBadge";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PaymentTerminalModal } from "@/components/terminal/PaymentTerminalModal";
import { CreditCard, LogOut, LogIn, UserCheck, ShieldAlert } from "lucide-react";

export function Header() {
  const { user, logout } = useAuth();
  const [terminalOpen, setTerminalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-700/60 bg-slate-900/80 px-4 md:px-6 backdrop-blur-sm">
        {/* Left: Sim badge */}
        <div className="flex items-center gap-3">
          <SimBadge />
        </div>

        {/* Right: Actions & User credentials */}
        <div className="flex items-center gap-3">
          {/* Customer Payment Terminal Button */}
          <button
            onClick={() => setTerminalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/40 hover:to-blue-600/40 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition-all shadow-sm active:scale-95"
            title="Open Interactive Customer Payment Terminal"
          >
            <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">💳 Customer Checkout</span>
            <span className="sm:hidden">Pay</span>
          </button>

          {/* User profile / session pill */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200 leading-tight">
                  {user.displayName || user.email}
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {user.role === "admin" ? "Fraud Ops Lead" : "Senior Analyst"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border ${
                    user.role === "admin"
                      ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                      : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                  }`}
                >
                  {user.role}
                </span>

                <button
                  onClick={() => void logout()}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sign In</span>
            </Link>
          )}

          <ThemeToggle />
        </div>
      </header>

      {/* Interactive Payment Checkout Modal */}
      <PaymentTerminalModal
        open={terminalOpen}
        onOpenChange={setTerminalOpen}
      />
    </>
  );
}
