import { NextRequest } from "next/server";
import { transactionStore } from "@/lib/store/transactionStore";
import { simulator } from "@/lib/simulator/simulator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Ensure simulator is initiated
  simulator.getStatus();

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Helper to safely write SSE messages
  let isClosed = false;
  const send = async (event: string, data: unknown) => {
    if (isClosed) return;
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(payload));
    } catch {
      isClosed = true;
    }
  };

  // 1. Send initial snapshot
  const initialData = {
    transactions: transactionStore.getTransactions(50),
    kpi: transactionStore.getKpiSnapshot(),
    timeSeries: transactionStore.getTimeSeries(15),
    simulatorStatus: simulator.getStatus(),
  };

  void send("init", initialData);

  // 2. Subscribe to transaction store events
  const unsubscribe = transactionStore.subscribe((storeEvent) => {
    if (isClosed) return;
    if (storeEvent.type === "transaction") {
      void send("transaction", storeEvent.data);
      void send("timeseries", transactionStore.getTimeSeries(15));
    } else if (storeEvent.type === "update") {
      void send("transaction_update", storeEvent.data);
    } else if (storeEvent.type === "kpi") {
      void send("kpi", storeEvent.data);
    }
  });

  // 3. Heartbeat / ping interval to keep connection alive
  const pingInterval = setInterval(() => {
    if (isClosed) {
      clearInterval(pingInterval);
      return;
    }
    void send("ping", { t: Date.now() });
  }, 15000);

  // 4. Handle client disconnect
  req.signal.addEventListener("abort", () => {
    isClosed = true;
    clearInterval(pingInterval);
    unsubscribe();
    try {
      void writer.close();
    } catch {
      // ignore
    }
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Encoding": "none",
    },
  });
}
