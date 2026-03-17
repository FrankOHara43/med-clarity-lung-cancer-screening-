import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/client";

export type ReportRecord = {
  reportId: string;
  patient: string;
  type: string;
  date: string;
  status: "Completed" | "Pending Review" | "Flagged";
  physician: string;
  prediction: string;
  confidence: number;
  notes?: string;
};

export type CreateReportPayload = {
  patient: string;
  type: string;
  date?: string;
  status: ReportRecord["status"];
  physician: string;
  prediction: string;
  confidence: number;
  notes?: string;
};

const COLLECTION = "reports";

export const getReports = async (): Promise<ReportRecord[]> => {
  const snapshot = await getDocs(query(collection(db, COLLECTION), orderBy("date", "desc")));
  return snapshot.docs.map((entry) => {
    const data = entry.data() as Record<string, unknown>;
    return {
      reportId: String(data.reportId ?? entry.id),
      patient: String(data.patient ?? "Unknown"),
      type: String(data.type ?? "Clinical Report"),
      date: String(data.date ?? ""),
      status: (String(data.status ?? "Completed") as ReportRecord["status"]),
      physician: String(data.physician ?? "System"),
      prediction: String(data.prediction ?? "Unknown"),
      confidence: Number(data.confidence ?? 0),
      notes: data.notes !== undefined ? String(data.notes) : undefined,
    };
  });
};

export const subscribeReports = (
  onData: (rows: ReportRecord[]) => void,
  onError?: (error: Error) => void
) => {
  const q = query(collection(db, COLLECTION), orderBy("date", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((entry) => {
        const data = entry.data() as Record<string, unknown>;
        return {
          reportId: String(data.reportId ?? entry.id),
          patient: String(data.patient ?? "Unknown"),
          type: String(data.type ?? "Clinical Report"),
          date: String(data.date ?? ""),
          status: (String(data.status ?? "Completed") as ReportRecord["status"]),
          physician: String(data.physician ?? "System"),
          prediction: String(data.prediction ?? "Unknown"),
          confidence: Number(data.confidence ?? 0),
          notes: data.notes !== undefined ? String(data.notes) : undefined,
        };
      });
      onData(rows);
    },
    (error) => onError?.(error as Error)
  );
};

export const createReport = async (payload: CreateReportPayload): Promise<string> => {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, {
    reportId: ref.id,
    patient: payload.patient,
    type: payload.type,
    date: payload.date ?? new Date().toISOString().slice(0, 10),
    status: payload.status,
    physician: payload.physician,
    prediction: payload.prediction,
    confidence: payload.confidence,
    notes: payload.notes ?? "",
  });
  return ref.id;
};

export const markReportStatus = async (id: string, status: ReportRecord["status"]): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, id), { status });
};