import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Query,
  QueryConstraint,
  DocumentData,
  WriteBatch,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';

/**
 * Add a document to a collection
 */
export const addDocument = async <T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> => {
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
};

/**
 * Get a single document by ID
 */
export const getDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as T) : null;
};

/**
 * Get all documents from a collection
 */
export const getDocuments = async <T extends DocumentData>(
  collectionName: string
): Promise<(T & { id: string })[]> => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T & { id: string }));
};

/**
 * Query documents with conditions
 */
export const queryDocuments = async <T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[]
): Promise<(T & { id: string })[]> => {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T & { id: string }));
};

/**
 * Update a document
 */
export const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  const docRef = doc(db, collectionName, docId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(docRef, data as any);
};

/**
 * Delete a document
 */
export const deleteDocument = async (
  collectionName: string,
  docId: string
): Promise<void> => {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
};

/**
 * Perform a batch write operation
 */
export const performBatchWrite = async (
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    id: string;
    data?: DocumentData;
  }>
): Promise<void> => {
  const batch = writeBatch(db);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operations.forEach((op: any) => {
    const docRef = doc(db, op.collection, op.id);
    if (op.type === 'set' && op.data) {
      batch.set(docRef, op.data as DocumentData);
    } else if (op.type === 'update' && op.data) {
      batch.update(docRef, op.data as DocumentData);
    } else if (op.type === 'delete') {
      batch.delete(docRef);
    }
  });

  await batch.commit();
};

/**
 * Get reference to a query
 */
export const getQueryReference = (
  collectionName: string,
  constraints: QueryConstraint[]
): Query => {
  return query(collection(db, collectionName), ...constraints);
};

/**
 * Helper to create where constraint
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const whereConstraint = (field: string, operator: any, value: any) => {
  return where(field, operator, value);
};

/**
 * Helper to create orderBy constraint
 */
export const orderByConstraint = (field: string, direction: 'asc' | 'desc' = 'asc') => {
  return orderBy(field, direction);
};

/**
 * Helper to create limit constraint
 */
export const limitConstraint = (limitValue: number) => {
  return limit(limitValue);
};
