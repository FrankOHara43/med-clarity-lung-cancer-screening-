import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";

export type PatientFormValues = {
  patientName: string;
  age: number;
  gender: string;
  diagnosis: string;
  status: string;
  notes?: string;
};

type Props = {
  isOpen: boolean;
  initialValues?: PatientFormValues | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: PatientFormValues) => Promise<void>;
};

const defaultValues: PatientFormValues = {
  patientName: "",
  age: 0,
  gender: "male",
  diagnosis: "",
  status: "Screening",
  notes: "",
};

export function PatientFormModal({ isOpen, initialValues, loading = false, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<PatientFormValues>(defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialValues) {
      setForm(initialValues);
    } else {
      setForm(defaultValues);
    }
    setErrors({});
  }, [initialValues, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.patientName.trim()) nextErrors.patientName = "Patient name is required";
    if (!Number.isFinite(form.age) || form.age < 0 || form.age > 150) nextErrors.age = "Age must be between 0 and 150";
    if (!form.gender.trim()) nextErrors.gender = "Gender is required";
    if (!form.diagnosis.trim()) nextErrors.diagnosis = "Diagnosis is required";
    if (!form.status.trim()) nextErrors.status = "Status is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-background border border-border rounded-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{initialValues ? "Edit Patient" : "Add Patient"}</h2>
          <button onClick={onClose} className="p-1 rounded-sm hover:bg-muted" disabled={loading}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Patient Name</label>
            <input
              className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-surface text-foreground"
              value={form.patientName}
              onChange={(e) => setForm((prev) => ({ ...prev, patientName: e.target.value }))}
              disabled={loading}
            />
            {errors.patientName && <p className="text-xs text-risk-high mt-1">{errors.patientName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Age</label>
              <input
                type="number"
                className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-surface text-foreground"
                value={form.age}
                onChange={(e) => setForm((prev) => ({ ...prev, age: Number(e.target.value) }))}
                disabled={loading}
              />
              {errors.age && <p className="text-xs text-risk-high mt-1">{errors.age}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Gender</label>
              <select
                className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-surface text-foreground"
                value={form.gender}
                onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
                disabled={loading}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Diagnosis</label>
            <input
              className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-surface text-foreground"
              value={form.diagnosis}
              onChange={(e) => setForm((prev) => ({ ...prev, diagnosis: e.target.value }))}
              disabled={loading}
            />
            {errors.diagnosis && <p className="text-xs text-risk-high mt-1">{errors.diagnosis}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Status</label>
            <select
              className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-surface text-foreground"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              disabled={loading}
            >
              <option value="Screening">Screening</option>
              <option value="Confirmed">Confirmed</option>
              <option value="High Risk">High Risk</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes (optional)</label>
            <textarea
              rows={3}
              className="w-full border border-border rounded-sm px-3 py-2 text-sm bg-surface text-foreground"
              value={form.notes || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-sm border border-border" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm rounded-sm bg-primary text-primary-foreground" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}