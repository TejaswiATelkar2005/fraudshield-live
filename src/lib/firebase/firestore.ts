import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  type Unsubscribe,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./config";
import type { ScoredTransaction, AlertStatus } from "@/lib/types";

const COLLECTION_NAME = "transactions";

/**
 * Save a newly scored transaction to Firestore
 */
export async function saveTransactionToFirestore(
  tx: ScoredTransaction
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  try {
    const docRef = doc(db, COLLECTION_NAME, tx.id);
    await setDoc(docRef, {
      ...tx,
      _updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[Firestore] Failed to persist transaction:", err);
  }
}

/**
 * Update an alert decision in Firestore with analyst notes
 */
export async function updateAlertInFirestore(
  id: string,
  update: {
    alertStatus: AlertStatus;
    analystNote?: string;
    analystId?: string;
    resolvedAt?: string;
  }
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      alertStatus: update.alertStatus,
      analystNote: update.analystNote || "",
      analystId: update.analystId || "analyst-1",
      resolvedAt: update.resolvedAt || new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[Firestore] Failed to update alert in Firestore:", err);
  }
}

/**
 * Subscribe to real-time transactions from Firestore using onSnapshot
 */
export function subscribeToFirestoreTransactions(
  callback: (transactions: ScoredTransaction[]) => void
): Unsubscribe | null {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const transactions: ScoredTransaction[] = [];
        snapshot.forEach((docSnap) => {
          transactions.push(docSnap.data() as ScoredTransaction);
        });
        if (transactions.length > 0) {
          callback(transactions);
        }
      },
      (error) => {
        console.warn("[Firestore] onSnapshot error:", error);
      }
    );
  } catch (err) {
    console.warn("[Firestore] Subscription failed:", err);
    return null;
  }
}
