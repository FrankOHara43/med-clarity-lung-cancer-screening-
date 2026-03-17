/**
 * User type for authentication
 */
export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: 'doctor' | 'admin' | 'patient';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Patient type
 */
export interface Patient {
  id: string;
  fullName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
  symptoms: string[];
  diagnosisStatus: 'pending' | 'in-progress' | 'completed' | 'reviewed';
  medicalHistory?: string;
  allergies?: string[];
  currentMedications?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Prediction type
 */
export interface Prediction {
  id: string;
  patientId: string;
  riskLevel: 'low' | 'medium' | 'high';
  score: number; // 0-100
  confidence: number; // 0-100
  modelVersion: string;
  scanType?: string;
  findings?: string;
  recommendations?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Report type
 */
export interface Report {
  id: string;
  patientId: string;
  doctorId: string;
  status: 'draft' | 'pending-review' | 'reviewed' | 'finalized';
  doctorNote: string;
  summary?: string;
  findings?: string;
  recommendations?: string[];
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
}

/**
 * Firestore Patient document (with id)
 */
export type FirestorePatient = Patient & { id: string };

/**
 * Firestore Prediction document (with id)
 */
export type FirestorePrediction = Prediction & { id: string };

/**
 * Firestore Report document (with id)
 */
export type FirestoreReport = Report & { id: string };

/**
 * n8n Webhook payload types
 */

export interface PatientCreatedPayload {
  patientId: string;
  fullName: string;
  createdAt: string;
}

export interface PredictionCompletedPayload {
  patientId: string;
  riskLevel: 'low' | 'medium' | 'high';
  score: number;
}

export interface HighRiskAlertPayload {
  patientId: string;
  riskLevel: 'high';
  score: number;
  timestamp: string;
}

export interface ReportFinalizedPayload {
  reportId: string;
  patientId: string;
  status: 'finalized';
  doctorNote: string;
}

/**
 * Service response types
 */

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
