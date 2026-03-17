export interface PredictionPayload {
  age: number;
  gender: string;
  smoking: string;
  symptoms: string;
  biomarkers: {
    ca125: number | null;
    cea: number | null;
    psa: number | null;
    afp: number | null;
  };
}

export interface PredictionResponse {
  /** Raw string returned by the webhook – may be "low"/"medium"/"high" or "Benign"/"Malignant" */
  prediction: string;
  confidence: number;
}

export const runPrediction = async (payload: PredictionPayload): Promise<PredictionResponse> => {
  const endpoint = import.meta.env.VITE_N8N_WEBHOOK_URL;
  if (!endpoint) {
    throw new Error("VITE_N8N_WEBHOOK_URL is missing");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    prediction: String(data.prediction ?? "unknown"),
    confidence: Number(data.confidence ?? 0),
  };
};