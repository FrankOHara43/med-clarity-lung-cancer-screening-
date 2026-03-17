import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/client";

export interface PatientRecord {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  diagnosis: string;
  status: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type CreatePatientInput = Omit<PatientRecord, "id" | "createdAt" | "updatedAt">;

const COLLECTION = "patients";

export const createPatient = async (payload: CreatePatientInput): Promise<string> => {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, {
    id: ref.id,
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getPatients = async (): Promise<PatientRecord[]> => {
  const snapshot = await getDocs(query(collection(db, COLLECTION), orderBy("updatedAt", "desc")));
  return snapshot.docs.map((entry) => {
    const data = entry.data() as Record<string, unknown>;
    return {
      id: entry.id,
      patientName: String(data.patientName ?? ""),
      age: Number(data.age ?? 0),
      gender: String(data.gender ?? ""),
      diagnosis: String(data.diagnosis ?? ""),
      status: String(data.status ?? ""),
      notes: typeof data.notes === "string" ? data.notes : "",
      createdAt: (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.(),
      updatedAt: (data.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.(),
    };
  });
};

export const getPatientById = async (id: string): Promise<PatientRecord | null> => {
  const snapshot = await getDoc(doc(db, COLLECTION, id));
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as Record<string, unknown>;
  return {
    id: snapshot.id,
    patientName: String(data.patientName ?? ""),
    age: Number(data.age ?? 0),
    gender: String(data.gender ?? ""),
    diagnosis: String(data.diagnosis ?? ""),
    status: String(data.status ?? ""),
    notes: typeof data.notes === "string" ? data.notes : "",
    createdAt: (data.createdAt as { toDate?: () => Date } | undefined)?.toDate?.(),
    updatedAt: (data.updatedAt as { toDate?: () => Date } | undefined)?.toDate?.(),
  };
};

export const updatePatient = async (
  id: string,
  payload: Partial<Omit<PatientRecord, "id" | "createdAt" | "updatedAt">>
): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
};

export const deletePatient = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
};