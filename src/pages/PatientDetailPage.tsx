import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowLeft, Edit, FileText, Brain } from "lucide-react";
import { getPatientById, updatePatient, type PatientRecord } from "@/services/patientService";
import { createReport } from "@/services/reportService";
import { PatientFormModal } from "@/components/PatientFormModal";
import { toast } from "@/components/ui/use-toast";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getPatientById(id);
        setPatient(data);
      } catch (error: unknown) {
        toast({
          variant: "destructive",
          title: "Failed to load patient",
          description: error instanceof Error ? error.message : "Unexpected error",
        });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const timeline = useMemo(() => {
    if (!patient) return [];
    return [
      { date: patient.updatedAt?.toISOString().slice(0, 10) || "-", event: `Status set to ${patient.status}` },
      { date: patient.createdAt?.toISOString().slice(0, 10) || "-", event: "Patient record created" },
    ];
  }, [patient]);

  const savePatient = async (values: {
    patientName: string;
    age: number;
    gender: string;
    diagnosis: string;
    status: string;
    notes?: string;
  }) => {
    if (!patient) return;
    setSaving(true);
    try {
      await updatePatient(patient.id, values);
      setPatient((prev) => (prev ? { ...prev, ...values, updatedAt: new Date() } : prev));
      setOpenEdit(false);
      toast({ title: "Patient updated", description: "Patient profile saved successfully." });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setSaving(false);
    }
  };

  const generatePatientReport = async () => {
    if (!patient) return;
    try {
      await createReport({
        patient: patient.patientName,
        type: "Clinical Follow-up Report",
        date: new Date().toISOString().slice(0, 10),
        status: patient.status === "High Risk" ? "Flagged" : "Pending Review",
        physician: "Current User",
        prediction: patient.status === "High Risk" ? "High" : "Review Needed",
        confidence: patient.status === "High Risk" ? 85 : 50,
        notes: patient.notes || `${patient.diagnosis} - auto-generated follow-up summary.`,
      });
      toast({ title: "Report generated", description: "Report saved to backend and visible in Reports." });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Report generation failed",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="text-sm text-muted-foreground">Loading patient details...</div>
      </AppLayout>
    );
  }

  if (!patient) {
    return (
      <AppLayout>
        <div className="space-y-4">
          <Link to="/patients" className="text-sm text-primary hover:underline">Back to Patients</Link>
          <div className="text-sm text-muted-foreground">Patient not found.</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/patients" className="p-1.5 rounded-sm hover:bg-secondary transition-colors">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
          <span className="text-sm text-muted-foreground font-mono">{patient.id}</span>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4 clinical-card">
            <div className="clinical-card-header">
              <span className="clinical-card-title">Patient Profile</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-sm bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                  {getInitials(patient.patientName)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{patient.patientName}</p>
                  <p className="text-xs text-muted-foreground">{patient.diagnosis}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Age", `${patient.age}`],
                  ["Gender", patient.gender],
                  ["Status", patient.status],
                  ["Created", patient.createdAt?.toISOString().slice(0, 10) || "-"],
                  ["Updated", patient.updatedAt?.toISOString().slice(0, 10) || "-"],
                  ["Diagnosis", patient.diagnosis],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="text-sm text-foreground font-medium">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <button onClick={() => setOpenEdit(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-foreground rounded-sm text-xs font-medium hover:bg-muted transition-colors">
                  <Edit className="h-3 w-3" /> Edit
                </button>
                <button onClick={generatePatientReport} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-foreground rounded-sm text-xs font-medium hover:bg-muted transition-colors">
                  <FileText className="h-3 w-3" /> Generate Report
                </button>
                <Link to="/prediction" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-sm text-xs font-medium hover:opacity-90 transition-opacity">
                  <Brain className="h-3 w-3" /> Run Prediction
                </Link>
              </div>
            </div>
          </div>

          <div className="col-span-8 space-y-4">
            <div className="clinical-card">
              <div className="clinical-card-header">
                <span className="clinical-card-title">Clinical Notes</span>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground">{patient.notes || "No clinical notes available."}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="clinical-card">
          <div className="clinical-card-header">
            <span className="clinical-card-title">Patient Timeline</span>
          </div>
          <div className="p-4">
            <div className="relative pl-6">
              <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
              {timeline.map((t, i) => (
                <div key={i} className="relative pb-4 last:pb-0">
                  <div className="absolute left-[-16px] top-1 h-2 w-2 rounded-full bg-primary border-2 border-surface" />
                  <p className="text-xs font-mono text-muted-foreground">{t.date}</p>
                  <p className="text-sm text-foreground">{t.event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <PatientFormModal
        isOpen={openEdit}
        loading={saving}
        onClose={() => setOpenEdit(false)}
        onSubmit={savePatient}
        initialValues={{
          patientName: patient.patientName,
          age: patient.age,
          gender: patient.gender,
          diagnosis: patient.diagnosis,
          status: patient.status,
          notes: patient.notes,
        }}
      />
    </AppLayout>
  );
}