"use client";

import { useEffect, useState, useRef } from "react";
import type {
  ScoredTransaction,
  KpiSnapshot,
  TimeSeriesPoint,
  SimulatorStatus,
} from "@/lib/types";
import { subscribeToFirestoreTransactions } from "@/lib/firebase/firestore";

export interface UseSSEResult {
  transactions: ScoredTransaction[];
  kpi: KpiSnapshot | null;
  timeSeries: TimeSeriesPoint[];
  simulatorStatus: SimulatorStatus | null;
  connected: boolean;
  error: string | null;
}

export function useSSE(url: string = "/api/stream"): UseSSEResult {
  const [transactions, setTransactions] = useState<ScoredTransaction[]>([]);
  const [kpi, setKpi] = useState<KpiSnapshot | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [simulatorStatus, setSimulatorStatus] = useState<SimulatorStatus | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isCancelled = false;

    function connect() {
      if (isCancelled) return;

      try {
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onopen = () => {
          if (isCancelled) return;
          setConnected(true);
          setError(null);
        };

        es.onerror = () => {
          if (isCancelled) return;
          setConnected(false);
          setError("Connection lost. Retrying…");
          es.close();

          // Exponential backoff or 3s retry
          retryTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        };

        es.addEventListener("init", (e: MessageEvent) => {
          if (isCancelled) return;
          try {
            const data = JSON.parse(e.data) as {
              transactions: ScoredTransaction[];
              kpi: KpiSnapshot;
              timeSeries: TimeSeriesPoint[];
              simulatorStatus?: SimulatorStatus;
            };
            setTransactions(data.transactions || []);
            setKpi(data.kpi || null);
            setTimeSeries(data.timeSeries || []);
            if (data.simulatorStatus) {
              setSimulatorStatus(data.simulatorStatus);
            }
          } catch (err) {
            console.error("Failed to parse init SSE event:", err);
          }
        });

        es.addEventListener("transaction", (e: MessageEvent) => {
          if (isCancelled) return;
          try {
            const newTx = JSON.parse(e.data) as ScoredTransaction;
            setTransactions((prev) => [newTx, ...prev.slice(0, 99)]);
          } catch (err) {
            console.error("Failed to parse transaction SSE event:", err);
          }
        });

        es.addEventListener("transaction_update", (e: MessageEvent) => {
          if (isCancelled) return;
          try {
            const updated = JSON.parse(e.data) as ScoredTransaction;
            setTransactions((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
          } catch (err) {
            console.error("Failed to parse transaction_update SSE event:", err);
          }
        });

        es.addEventListener("kpi", (e: MessageEvent) => {
          if (isCancelled) return;
          try {
            const newKpi = JSON.parse(e.data) as KpiSnapshot;
            setKpi(newKpi);
          } catch (err) {
            console.error("Failed to parse kpi SSE event:", err);
          }
        });

        es.addEventListener("timeseries", (e: MessageEvent) => {
          if (isCancelled) return;
          try {
            const points = JSON.parse(e.data) as TimeSeriesPoint[];
            setTimeSeries(points);
          } catch (err) {
            console.error("Failed to parse timeseries SSE event:", err);
          }
        });
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "SSE failed");
          retryTimeoutRef.current = setTimeout(connect, 4000);
        }
      }
    }

    connect();

    // Firestore live listener (Phase 2)
    const unsubFirestore = subscribeToFirestoreTransactions((fsTransactions) => {
      if (isCancelled) return;
      setTransactions((prev) => {
        const merged = [...fsTransactions];
        for (const p of prev) {
          if (!merged.some((m) => m.id === p.id)) {
            merged.push(p);
          }
        }
        return merged.slice(0, 100);
      });
    });

    return () => {
      isCancelled = true;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (unsubFirestore) {
        unsubFirestore();
      }
    };
  }, [url]);

  return { transactions, kpi, timeSeries, simulatorStatus, connected, error };
}
