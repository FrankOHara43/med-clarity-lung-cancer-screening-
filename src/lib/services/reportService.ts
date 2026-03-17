import { Report, FirestoreReport } from '../types/index';
import * as firestoreModule from '../firebase/firestore';
import { triggerReportFinalized } from './workflowService';

/**
 * Create a new report
 */
export const createReport = async (
  patientId: string,
  doctorId: string,
  doctorNote: string,
  summary?: string,
  findings?: string,
  recommendations?: string[]
): Promise<string> => {
  try {
    const now = new Date();

    const reportData: Report = {
      id: '', // Will be set by Firestore
      patientId,
      doctorId,
      status: 'draft',
      doctorNote,
      summary,
      findings,
      recommendations,
      createdAt: now,
      updatedAt: now,
    };

    // Save report to Firestore
    const reportId = await firestoreModule.addDocument('reports', reportData);

    return reportId;
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

/**
 * Get report by ID
 */
export const getReport = async (reportId: string): Promise<FirestoreReport | null> => {
  try {
    const report = await firestoreModule.getDocument<Report>('reports', reportId);

    if (report) {
      return {
        ...report,
        id: reportId,
      } as FirestoreReport;
    }

    return null;
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error;
  }
};

/**
 * Get all reports for a patient
 */
export const getPatientReports = async (patientId: string): Promise<FirestoreReport[]> => {
  try {
    const reports = await firestoreModule.queryDocuments<Report>(
      'reports',
      [firestoreModule.whereConstraint('patientId', '==', patientId)]
    );

    return reports as unknown as FirestoreReport[];
  } catch (error) {
    console.error('Error fetching patient reports:', error);
    throw error;
  }
};

/**
 * Get latest report for a patient
 */
export const getLatestPatientReport = async (
  patientId: string
): Promise<FirestoreReport | null> => {
  try {
    const reports = await firestoreModule.queryDocuments<Report>(
      'reports',
      [
        firestoreModule.whereConstraint('patientId', '==', patientId),
        firestoreModule.orderByConstraint('createdAt', 'desc'),
        firestoreModule.limitConstraint(1),
      ]
    );

    return reports.length > 0 ? (reports[0] as FirestoreReport) : null;
  } catch (error) {
    console.error('Error fetching latest report:', error);
    return null;
  }
};

/**
 * Get reports by doctor
 */
export const getDoctorReports = async (doctorId: string): Promise<FirestoreReport[]> => {
  try {
    const reports = await firestoreModule.queryDocuments<Report>(
      'reports',
      [firestoreModule.whereConstraint('doctorId', '==', doctorId)]
    );

    return reports as unknown as FirestoreReport[];
  } catch (error) {
    console.error('Error fetching doctor reports:', error);
    throw error;
  }
};

/**
 * Update report status and trigger webhook if finalized
 */
export const updateReportStatus = async (
  reportId: string,
  status: 'draft' | 'pending-review' | 'reviewed' | 'finalized'
): Promise<void> => {
  try {
    const report = await getReport(reportId);

    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    // Update status
    await firestoreModule.updateDocument('reports', reportId, {
      status,
      updatedAt: new Date(),
      ...(status === 'reviewed' && { reviewedAt: new Date() }),
    });

    // If finalized, trigger webhook
    if (status === 'finalized') {
      await triggerReportFinalized({
        reportId,
        patientId: report.patientId,
        status: 'finalized',
        doctorNote: report.doctorNote,
      });
    }
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
};

/**
 * Update report content
 */
export const updateReport = async (
  reportId: string,
  updates: Partial<Report>
): Promise<void> => {
  try {
    await firestoreModule.updateDocument('reports', reportId, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};

/**
 * Delete report
 */
export const deleteReport = async (reportId: string): Promise<void> => {
  try {
    await firestoreModule.deleteDocument('reports', reportId);
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

/**
 * Get all reports with pending review
 */
export const getPendingReviews = async (): Promise<FirestoreReport[]> => {
  try {
    const reports = await firestoreModule.queryDocuments<Report>(
      'reports',
      [firestoreModule.whereConstraint('status', '==', 'pending-review')]
    );

    return reports as unknown as FirestoreReport[];
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    throw error;
  }
};

/**
 * Get finalized reports
 */
export const getFinalizedReports = async (): Promise<FirestoreReport[]> => {
  try {
    const reports = await firestoreModule.queryDocuments<Report>(
      'reports',
      [firestoreModule.whereConstraint('status', '==', 'finalized')]
    );

    return reports as unknown as FirestoreReport[];
  } catch (error) {
    console.error('Error fetching finalized reports:', error);
    throw error;
  }
};

/**
 * Get report statistics
 */
export const getReportStats = async (): Promise<{
  totalReports: number;
  draftCount: number;
  pendingReviewCount: number;
  reviewedCount: number;
  finalizedCount: number;
}> => {
  try {
    const allReports = await firestoreModule.getDocuments<Report>('reports');

    return {
      totalReports: allReports.length,
      draftCount: allReports.filter((r) => r.status === 'draft').length,
      pendingReviewCount: allReports.filter((r) => r.status === 'pending-review').length,
      reviewedCount: allReports.filter((r) => r.status === 'reviewed').length,
      finalizedCount: allReports.filter((r) => r.status === 'finalized').length,
    };
  } catch (error) {
    console.error('Error fetching report stats:', error);
    throw error;
  }
};
