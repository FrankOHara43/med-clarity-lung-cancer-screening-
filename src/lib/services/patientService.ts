import { Patient, FirestorePatient } from '../types/index';
import * as firestoreModule from '../firebase/firestore';
import * as storageModule from '../firebase/storage';
import { triggerPatientCreated } from './workflowService';
import { PatientRegistrationInput } from '../validators/patient';

/**
 * Create a new patient and trigger webhook
 */
export const createPatient = async (data: PatientRegistrationInput): Promise<string> => {
  try {
    const now = new Date();

    const patientData: Patient = {
      id: '', // Will be set by Firestore
      fullName: data.fullName,
      age: data.age,
      gender: data.gender,
      symptoms: data.symptoms,
      diagnosisStatus: 'pending',
      medicalHistory: data.medicalHistory,
      allergies: data.allergies,
      currentMedications: data.currentMedications,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Create patient document in Firestore
    const patientId = await firestoreModule.addDocument('patients', patientData);

    // 2. Trigger webhook (async, non-blocking)
    await triggerPatientCreated({
      patientId,
      fullName: data.fullName,
      createdAt: now.toISOString(),
    });

    return patientId;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
};

/**
 * Get patient by ID
 */
export const getPatient = async (patientId: string): Promise<FirestorePatient | null> => {
  try {
    const patient = await firestoreModule.getDocument<Patient>('patients', patientId);

    if (patient) {
      return {
        ...patient,
        id: patientId,
      } as FirestorePatient;
    }

    return null;
  } catch (error) {
    console.error('Error fetching patient:', error);
    throw error;
  }
};

/**
 * Get all patients
 */
export const getAllPatients = async (): Promise<FirestorePatient[]> => {
  try {
    const patients = await firestoreModule.getDocuments<Patient>('patients');
    return patients as unknown as FirestorePatient[];
  } catch (error) {
    console.error('Error fetching all patients:', error);
    throw error;
  }
};

/**
 * Update patient details
 */
export const updatePatient = async (
  patientId: string,
  updates: Partial<Patient>
): Promise<void> => {
  try {
    await firestoreModule.updateDocument('patients', patientId, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

/**
 * Update patient diagnosis status
 */
export const updatePatientStatus = async (
  patientId: string,
  status: 'pending' | 'in-progress' | 'completed' | 'reviewed'
): Promise<void> => {
  try {
    await updatePatient(patientId, { diagnosisStatus: status });
  } catch (error) {
    console.error('Error updating patient status:', error);
    throw error;
  }
};

/**
 * Delete patient (admin only)
 */
export const deletePatient = async (patientId: string): Promise<void> => {
  try {
    await firestoreModule.deleteDocument('patients', patientId);
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
};

/**
 * Get patients by diagnosis status
 */
export const getPatientsByStatus = async (
  status: 'pending' | 'in-progress' | 'completed' | 'reviewed'
): Promise<FirestorePatient[]> => {
  try {
    const patients = await firestoreModule.queryDocuments<Patient>(
      'patients',
      [firestoreModule.whereConstraint('diagnosisStatus', '==', status)]
    );
    return patients as unknown as FirestorePatient[];
  } catch (error) {
    console.error('Error fetching patients by status:', error);
    throw error;
  }
};

/**
 * Search patients by name
 */
export const searchPatientsByName = async (name: string): Promise<FirestorePatient[]> => {
  try {
    // Note: This is a simple prefix search. For more complex search,
    // consider using Firestore full-text search or Algolia
    const allPatients = await getAllPatients();

    return allPatients.filter((p) =>
      p.fullName.toLowerCase().includes(name.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching patients:', error);
    throw error;
  }
};

/**
 * Upload patient document (scan, test result, etc.)
 */
export const uploadPatientFile = async (
  patientId: string,
  fileType: 'scan' | 'report' | 'document',
  file: File
): Promise<string> => {
  try {
    if (fileType === 'scan') {
      return await storageModule.uploadPatientScan(patientId, 'scan', file);
    } else {
      return await storageModule.uploadPatientDocument(patientId, fileType, file);
    }
  } catch (error) {
    console.error('Error uploading patient file:', error);
    throw error;
  }
};

/**
 * Get all patient documents
 */
export const getPatientDocuments = async (patientId: string): Promise<string[]> => {
  try {
    return await storageModule.getPatientDocuments(patientId);
  } catch (error) {
    console.error('Error fetching patient documents:', error);
    throw error;
  }
};

/**
 * Get all patient scans
 */
export const getPatientScans = async (patientId: string): Promise<string[]> => {
  try {
    return await storageModule.getPatientScans(patientId);
  } catch (error) {
    console.error('Error fetching patient scans:', error);
    throw error;
  }
};
