import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Header } from "@/components/layout/Header";
import { SimBadge } from "@/components/layout/SimBadge";

export const metadata: Metadata = {
  title: "FraudShield Live",
  description:
    "Real-time AI-powered fraud detection for digital payments — demo simulation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-slate-900 text-slate-200 antialiased">
        <AuthProvider>
          <div className="flex min-h-screen">
            {/* Sidebar Navbar */}
            <Navbar />

            {/* Main content area */}
            <div className="flex flex-1 flex-col min-w-0">
              {/* Top bar with Auth and Terminal */}
              <Header />

              {/* Page content */}
              <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>

              {/* Footer */}
              <footer className="flex items-center justify-center border-t border-slate-700/60 py-3 text-xs text-slate-500">
                <SimBadge />
                <span className="ml-3">
                  © {new Date().getFullYear()} FraudShield Live — Educational Demo
                </span>
              </footer>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
