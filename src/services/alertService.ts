import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/client";

export type AlertRecord = {
  id: string;
  patientId: string;
  patientName: string;
  reason: string;
  severity: "Critical" | "Warning";
  state: "open" | "review" | "resolved" | "dismissed";
  assignedTo?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const COLLECTION = "alerts";

export const getAlerts = async (): Promise<AlertRecord[]> => {
  const snapshot = await getDocs(query(collection(db, COLLECTION), orderBy("updatedAt", "desc")));
  return snapshot.docs.map((entry) => {
    const data = entry.data() as Record<string, unknown>;
    return {
      id: entry.id,
      patientId: String(data.patientId ?? ""),
      patientName: String(data.patientName ?? ""),
      reason: String(data.reason ?? ""),
      severity: (String(data.severity ?? "Warning") as AlertRecord["severity"]),
      state: (String(data.state ?? "open") as AlertRecord["state"]),
      assignedTo: typeof data.assignedTo === "string" ? data.assignedTo : undefined,
      createdAt: (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.(),
      updatedAt: (data.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.(),
    };
  });
};

export const createAlert = async (
  payload: Omit<AlertRecord, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, {
    id: ref.id,
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateAlertState = async (id: string, state: AlertRecord["state"]): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, id), { state, updatedAt: serverTimestamp() });
};