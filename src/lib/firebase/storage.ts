import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getBytes,
  listAll,
  UploadMetadata,
} from 'firebase/storage';
import { storage } from './config';

/**
 * Upload a file to Firebase Storage
 */
export const uploadFile = async (
  path: string,
  file: File | Blob
): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
};

/**
 * Upload a file with metadata
 */
export const uploadFileWithMetadata = async (
  path: string,
  file: File | Blob,
  metadata?: UploadMetadata
): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, metadata);
  const url = await getDownloadURL(storageRef);
  return url;
};

/**
 * Download a file from Firebase Storage
 */
export const downloadFile = async (path: string): Promise<ArrayBuffer> => {
  const storageRef = ref(storage, path);
  return await getBytes(storageRef);
};

/**
 * Get the download URL for a file
 */
export const getFileUrl = async (path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  return await getDownloadURL(storageRef);
};

/**
 * Delete a file from Firebase Storage
 */
export const deleteFile = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};

/**
 * List all files in a directory
 */
export const listFiles = async (directoryPath: string): Promise<string[]> => {
  const dirRef = ref(storage, directoryPath);
  const result = await listAll(dirRef);
  return result.items.map((item) => item.fullPath);
};

/**
 * Upload patient document (image/PDF)
 */
export const uploadPatientDocument = async (
  patientId: string,
  fileType: string,
  file: File
): Promise<string> => {
  const timestamp = Date.now();
  const fileName = `${fileType}-${timestamp}`;
  const path = `patients/${patientId}/documents/${fileName}`;
  return await uploadFile(path, file);
};

/**
 * Upload patient scan image
 */
export const uploadPatientScan = async (
  patientId: string,
  scanType: string,
  file: File
): Promise<string> => {
  const timestamp = Date.now();
  const fileName = `${scanType}-${timestamp}`;
  const path = `patients/${patientId}/scans/${fileName}`;
  return await uploadFile(path, file);
};

/**
 * Delete patient document
 */
export const deletePatientDocument = async (
  patientId: string,
  fileName: string
): Promise<void> => {
  const path = `patients/${patientId}/documents/${fileName}`;
  await deleteFile(path);
};

/**
 * Get all patient documents
 */
export const getPatientDocuments = async (patientId: string): Promise<string[]> => {
  const directoryPath = `patients/${patientId}/documents`;
  return await listFiles(directoryPath);
};

/**
 * Get all patient scans
 */
export const getPatientScans = async (patientId: string): Promise<string[]> => {
  const directoryPath = `patients/${patientId}/scans`;
  return await listFiles(directoryPath);
};
