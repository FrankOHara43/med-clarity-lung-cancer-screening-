import {
  PatientCreatedPayload,
  PredictionCompletedPayload,
  HighRiskAlertPayload,
  ReportFinalizedPayload,
} from '../types/index';

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

/**
 * Base function to trigger webhooks
 * Never blocks Firebase writes - webhook failures are logged and ignored
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const triggerWebhook = async (payload: Record<string, any>): Promise<void> => {
  if (!WEBHOOK_URL) {
    console.warn('n8n webhook URL not configured. Skipping webhook trigger.');
    return;
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `Webhook request failed with status ${response.status}:`,
        await response.text()
      );
    } else {
      console.log('Webhook triggered successfully:', payload);
    }
  } catch (error) {
    // Never throw - webhooks are async and non-blocking
    console.error('Webhook error (non-blocking):', error);
  }
};

/**
 * Trigger webhook when a patient is created
 * Sends: patientId, fullName, createdAt
 */
export const triggerPatientCreated = async (
  payload: PatientCreatedPayload
): Promise<void> => {
  await triggerWebhook({
    event: 'patient.created',
    data: payload,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trigger webhook when a prediction is completed
 * Sends: patientId, riskLevel, score
 */
export const triggerPredictionCompleted = async (
  payload: PredictionCompletedPayload
): Promise<void> => {
  await triggerWebhook({
    event: 'prediction.completed',
    data: payload,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trigger urgent webhook for high-risk cases
 * Sends: patientId, riskLevel, score, timestamp
 */
export const triggerHighRiskAlert = async (
  payload: HighRiskAlertPayload
): Promise<void> => {
  await triggerWebhook({
    event: 'case.high_risk_alert',
    data: payload,
    timestamp: new Date().toISOString(),
    priority: 'urgent',
  });
};

/**
 * Trigger webhook when a report is finalized
 * Sends: reportId, patientId, status, doctorNote
 */
export const triggerReportFinalized = async (
  payload: ReportFinalizedPayload
): Promise<void> => {
  await triggerWebhook({
    event: 'report.finalized',
    data: payload,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Custom webhook trigger for any other event
 */
export const triggerCustomEvent = async (
  eventName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>
): Promise<void> => {
  await triggerWebhook({
    event: eventName,
    data: payload,
    timestamp: new Date().toISOString(),
  });
};
