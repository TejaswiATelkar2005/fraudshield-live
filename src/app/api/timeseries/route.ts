import { NextResponse } from "next/server";
import { transactionStore } from "@/lib/store/transactionStore";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(transactionStore.getTimeSeries(15));
}
