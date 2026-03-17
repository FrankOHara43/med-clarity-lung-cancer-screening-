import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "@/components/ui/use-toast";
import { runPrediction } from "@/services/predictionService";
import { createReport } from "@/services/reportService";
import { useAuth } from "@/auth/AuthContext";

const defaultForm = {
  patientName: "",
  age: "",
  gender: "",
  smoking: "",
  symptoms: "",
  ca125: "",
  cea: "",
  psa: "",
  afp: "",
};

// Accepts any string the webhook may return (e.g. "Benign", "Malignant", "low", "high")
type PredictionResult = { prediction: string; confidence: number };

/** Normalise webhook output to a lowercase key used in riskConfig */
function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase();
}

const riskConfig: Record<string, { label: string; color: string; stroke: string }> = {
  low:       { label: "Low Risk",    color: "text-risk-low",  stroke: "hsl(var(--risk-low))" },
  medium:    { label: "Medium Risk", color: "text-risk-med",  stroke: "hsl(var(--risk-med))" },
  high:      { label: "High Risk",   color: "text-risk-high", stroke: "hsl(var(--risk-high))" },
  benign:    { label: "Benign",      color: "text-risk-low",  stroke: "hsl(var(--risk-low))" },
  malignant: { label: "Malignant",   color: "text-risk-high", stroke: "hsl(var(--risk-high))" },
};

const FALLBACK = { label: "Unknown", color: "text-muted-foreground", stroke: "hsl(var(--border))" };

function getRisk(raw: string) {
  return riskConfig[normalizeKey(raw)] ?? FALLBACK;
}

export default function PredictionPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const validateForm = () => {
    if (!form.age || !form.gender || !form.smoking) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in Age, Gender, and Smoking History",
      });
      return false;
    }
    if (!form.ca125 && !form.cea && !form.psa && !form.afp) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter at least one biomarker value",
      });
      return false;
    }
    return true;
  };

  const executePrediction = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await runPrediction({
        age: Number(form.age),
        gender: form.gender,
        smoking: form.smoking,
        symptoms: form.symptoms,
        biomarkers: {
          ca125: form.ca125 ? Number(form.ca125) : null,
          cea: form.cea ? Number(form.cea) : null,
          psa: form.psa ? Number(form.psa) : null,
          afp: form.afp ? Number(form.afp) : null,
        },
      });

      const clampedConfidence = Math.max(0, Math.min(100, Math.round(Number(response.confidence) || 0)));
      setResult({ prediction: response.prediction, confidence: clampedConfidence });
      const display = getRisk(response.prediction).label;

      // Persist report to Firestore
      try {
        await createReport({
          patient: form.patientName.trim() || "Anonymous",
          type: "AI Prediction",
          date: new Date().toISOString().slice(0, 10),
          status: normalizeKey(response.prediction) === "malignant" || normalizeKey(response.prediction) === "high" ? "Flagged" : "Completed",
          physician: user?.displayName || user?.email || "System",
          notes: `Biomarkers — CA-125: ${form.ca125 || "N/A"}, CEA: ${form.cea || "N/A"}, PSA: ${form.psa || "N/A"}, AFP: ${form.afp || "N/A"}. Symptoms: ${form.symptoms || "None recorded"}.`,
          prediction: response.prediction,
          confidence: clampedConfidence,
        });
      } catch {
        // Non-fatal — prediction result still shown even if report save fails
        console.warn("Failed to save prediction report to Firestore");
      }

      toast({
        title: "Prediction complete",
        description: `${display} (${clampedConfidence}% confidence) — report saved`,
      });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Prediction failed",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 space-y-4">
          <div className="clinical-card">
            <div className="clinical-card-header">
              <span className="clinical-card-title">Biometrics</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Patient Name</label>
                <input type="text" value={form.patientName} onChange={(e) => handleChange("patientName", e.target.value)} disabled={loading}
                  className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-surface text-foreground outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. John Doe (leave blank for anonymous)" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Age *</label>
                <input type="number" value={form.age} onChange={(e) => handleChange("age", e.target.value)} disabled={loading}
                  className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-surface text-foreground outline-none focus:ring-1 focus:ring-primary font-mono" placeholder="e.g. 55" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Gender *</label>
                <select value={form.gender} onChange={(e) => handleChange("gender", e.target.value)} disabled={loading}
                  className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-surface text-foreground outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Smoking History *</label>
                <select value={form.smoking} onChange={(e) => handleChange("smoking", e.target.value)} disabled={loading}
                  className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-surface text-foreground outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="former">Former</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Symptoms</label>
                <textarea value={form.symptoms} onChange={(e) => handleChange("symptoms", e.target.value)} disabled={loading}
                  rows={3} className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-surface text-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Describe presenting symptoms..." />
              </div>
            </div>
          </div>

          <div className="clinical-card">
            <div className="clinical-card-header">
              <span className="clinical-card-title">Biomarkers (Blood Markers) *</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              {[
                { key: "ca125", label: "CA-125", unit: "U/mL", placeholder: "0-35 normal" },
                { key: "cea", label: "CEA", unit: "ng/mL", placeholder: "0-5 normal" },
                { key: "psa", label: "PSA", unit: "ng/mL", placeholder: "0-4 normal" },
                { key: "afp", label: "AFP", unit: "ng/mL", placeholder: "0-10 normal" },
              ].map((m) => (
                <div key={m.key}>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                    {m.label} <span className="text-muted-foreground/60 normal-case">({m.unit})</span>
                  </label>
                  <input type="number" value={form[m.key as keyof typeof form]} onChange={(e) => handleChange(m.key, e.target.value)} disabled={loading}
                    className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-surface text-foreground outline-none focus:ring-1 focus:ring-primary font-mono"
                    placeholder={m.placeholder} />
                </div>
              ))}
            </div>
          </div>

          <button onClick={executePrediction} disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-sm text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
            {loading ? "Executing Prediction..." : "Execute Prediction"}
          </button>
        </div>

        <div className="col-span-5">
          <div className="clinical-card sticky top-6">
            <div className="clinical-card-header">
              <span className="clinical-card-title">Prediction Result</span>
            </div>
            <div className="p-6">
              {result ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center">
                    <div className="relative w-40 h-40">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                        <circle cx="50" cy="50" r="42" fill="none"
                          stroke={getRisk(result.prediction).stroke}
                          strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={`${result.confidence * 2.64} 264`} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-semibold font-mono text-foreground">{result.confidence}%</span>
                        <span className="text-xs text-muted-foreground">Confidence</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-2">
                    <p className={`text-lg font-semibold tracking-tight ${getRisk(result.prediction).color}`}>
                      {getRisk(result.prediction).label}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono text-xs">raw: {result.prediction}</p>
                    <p className="text-sm text-foreground">Webhook response is live from n8n.</p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="flex justify-center mb-3">
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Enter patient data and execute prediction to view results.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}