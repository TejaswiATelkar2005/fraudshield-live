import { NextRequest, NextResponse } from "next/server";
import { transactionStore } from "@/lib/store/transactionStore";
import { UpdateAlertSchema } from "@/lib/validation/schemas";
import { updateAlertInFirestore } from "@/lib/firebase/firestore";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body: unknown = await req.json();

    const parsed = UpdateAlertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid alert update payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { status, analystNote, analystId } = parsed.data;
    const resolvedAt = new Date().toISOString();
    const updated = transactionStore.updateTransaction(id, {
      alertStatus: status,
      analystNote,
      analystId: analystId ?? "analyst-1",
      resolvedAt,
    });

    if (!updated) {
      return NextResponse.json(
        { error: `Transaction with ID '${id}' not found` },
        { status: 404 }
      );
    }

    void updateAlertInFirestore(id, {
      alertStatus: status,
      analystNote,
      analystId: analystId ?? "analyst-1",
      resolvedAt,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update alert status", message: String(error) },
      { status: 500 }
    );
  }
}
