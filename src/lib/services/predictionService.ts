import { Prediction, FirestorePrediction } from '../types/index';
import * as firestoreModule from '../firebase/firestore';
import {
  triggerPredictionCompleted,
  triggerHighRiskAlert,
} from './workflowService';

/**
 * Save a prediction and trigger appropriate webhooks
 */
export const savePrediction = async (
  patientId: string,
  riskLevel: 'low' | 'medium' | 'high',
  score: number,
  confidence: number,
  modelVersion: string,
  scanType?: string,
  findings?: string
): Promise<string> => {
  try {
    const now = new Date();

    const predictionData: Prediction = {
      id: '', // Will be set by Firestore
      patientId,
      riskLevel,
      score,
      confidence,
      modelVersion,
      scanType,
      findings,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Save prediction to Firestore
    const predictionId = await firestoreModule.addDocument('predictions', predictionData);

    // 2. Trigger prediction completed webhook
    await triggerPredictionCompleted({
      patientId,
      riskLevel,
      score,
    });

    // 3. If high risk, trigger urgent alert webhook
    if (riskLevel === 'high') {
      await triggerHighRiskAlert({
        patientId,
        riskLevel: 'high',
        score,
        timestamp: now.toISOString(),
      });
    }

    return predictionId;
  } catch (error) {
    console.error('Error saving prediction:', error);
    throw error;
  }
};

/**
 * Get prediction by ID
 */
export const getPrediction = async (
  predictionId: string
): Promise<FirestorePrediction | null> => {
  try {
    const prediction = await firestoreModule.getDocument<Prediction>(
      'predictions',
      predictionId
    );

    if (prediction) {
      return {
        ...prediction,
        id: predictionId,
      } as FirestorePrediction;
    }

    return null;
  } catch (error) {
    console.error('Error fetching prediction:', error);
    throw error;
  }
};

/**
 * Get all predictions for a patient
 */
export const getPatientPredictions = async (
  patientId: string
): Promise<FirestorePrediction[]> => {
  try {
    const predictions = await firestoreModule.queryDocuments<Prediction>(
      'predictions',
      [firestoreModule.whereConstraint('patientId', '==', patientId)]
    );

    return predictions as FirestorePrediction[];
  } catch (error) {
    console.error('Error fetching patient predictions:', error);
    throw error;
  }
};

/**
 * Get the latest prediction for a patient
 */
export const getLatestPatientPrediction = async (
  patientId: string
): Promise<FirestorePrediction | null> => {
  try {
    const predictions = await firestoreModule.queryDocuments<Prediction>(
      'predictions',
      [
        firestoreModule.whereConstraint('patientId', '==', patientId),
        firestoreModule.orderByConstraint('createdAt', 'desc'),
        firestoreModule.limitConstraint(1),
      ]
    );

    return predictions.length > 0 ? (predictions[0] as FirestorePrediction) : null;
  } catch (error) {
    console.error('Error fetching latest prediction:', error);
    return null;
  }
};

/**
 * Get all high-risk predictions
 */
export const getHighRiskPredictions = async (): Promise<FirestorePrediction[]> => {
  try {
    const predictions = await firestoreModule.queryDocuments<Prediction>(
      'predictions',
      [firestoreModule.whereConstraint('riskLevel', '==', 'high')]
    );

    return predictions as FirestorePrediction[];
  } catch (error) {
    console.error('Error fetching high-risk predictions:', error);
    throw error;
  }
};

/**
 * Update prediction
 */
export const updatePrediction = async (
  predictionId: string,
  updates: Partial<Prediction>
): Promise<void> => {
  try {
    await firestoreModule.updateDocument('predictions', predictionId, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating prediction:', error);
    throw error;
  }
};

/**
 * Delete prediction
 */
export const deletePrediction = async (predictionId: string): Promise<void> => {
  try {
    await firestoreModule.deleteDocument('predictions', predictionId);
  } catch (error) {
    console.error('Error deleting prediction:', error);
    throw error;
  }
};

/**
 * Evaluate risk level based on score
 * Customize scoring logic based on your ML model
 */
export const evaluateRisk = (
  score: number
): 'low' | 'medium' | 'high' => {
  if (score < 30) {
    return 'low';
  } else if (score < 70) {
    return 'medium';
  } else {
    return 'high';
  }
};

/**
 * Get prediction statistics for a patient
 */
export const getPatientPredictionStats = async (
  patientId: string
): Promise<{
  totalPredictions: number;
  avgScore: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
}> => {
  try {
    const predictions = await getPatientPredictions(patientId);

    if (predictions.length === 0) {
      return {
        totalPredictions: 0,
        avgScore: 0,
        highRiskCount: 0,
        mediumRiskCount: 0,
        lowRiskCount: 0,
      };
    }

    const avgScore = predictions.reduce((sum, p) => sum + p.score, 0) / predictions.length;
    const highRiskCount = predictions.filter((p) => p.riskLevel === 'high').length;
    const mediumRiskCount = predictions.filter((p) => p.riskLevel === 'medium').length;
    const lowRiskCount = predictions.filter((p) => p.riskLevel === 'low').length;

    return {
      totalPredictions: predictions.length,
      avgScore: Math.round(avgScore * 100) / 100,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
    };
  } catch (error) {
    console.error('Error fetching prediction stats:', error);
    throw error;
  }
};
