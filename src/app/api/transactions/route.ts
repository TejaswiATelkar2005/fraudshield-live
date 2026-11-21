import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { transactionStore } from "@/lib/store/transactionStore";
import { scoreTransaction } from "@/lib/scoring/scorer";
import { TransactionInputSchema } from "@/lib/validation/schemas";
import { saveTransactionToFirestore } from "@/lib/firebase/firestore";
import type { Decision, AlertStatus, ScoredTransaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const decisionParam = searchParams.get("decision");

  const limit = limitParam ? Math.min(500, Math.max(1, parseInt(limitParam, 10))) : 100;
  const decision =
    decisionParam === "APPROVED" || decisionParam === "REVIEW" || decisionParam === "HELD"
      ? (decisionParam as Decision)
      : undefined;

  const transactions = transactionStore.getTransactions(limit, decision);
  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const parsed = TransactionInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid transaction payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const txn = {
      id: input.id ?? `TXN-${uuidv4().slice(0, 8).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      customerId: input.customerId,
      channel: input.channel,
      amountINR: input.amountINR,
      merchantCategory: input.merchantCategory,
      city: input.city,
      deviceId: input.deviceId,
      isNewDevice: input.isNewDevice,
      isForeignLocation: input.isForeignLocation,
      hourOfDay: input.hourOfDay,
      txnsLast10Min: input.txnsLast10Min,
    };

    const score = await scoreTransaction(txn);
    const alertStatus: AlertStatus = score.decision === "APPROVED" ? "APPROVED" : "OPEN";

    const scoredTxn: ScoredTransaction = {
      ...txn,
      score,
      alertStatus,
    };

    transactionStore.addTransaction(scoredTxn);
    void saveTransactionToFirestore(scoredTxn);

    return NextResponse.json(scoredTxn, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error processing transaction", message: String(error) },
      { status: 500 }
    );
  }
}
