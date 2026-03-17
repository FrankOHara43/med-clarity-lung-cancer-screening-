import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, Plus, Pencil, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PatientFormModal, type PatientFormValues } from "@/components/PatientFormModal";
import { toast } from "@/components/ui/use-toast";
import { createPatient, deletePatient, getPatients, type PatientRecord, updatePatient } from "@/services/patientService";

function StatusBadge({ status }: { status: string }) {
  const styles = status === "High Risk"
    ? "bg-risk-high/10 text-risk-high border-risk-high/20"
    : status === "Confirmed"
      ? "bg-foreground/5 text-foreground border-foreground/10"
      : "bg-muted text-muted-foreground border-border";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium border ${styles}`}>{status}</span>;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Failed to load patients",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const query = search.toLowerCase();
      const matchSearch = p.patientName.toLowerCase().includes(query) || p.id.toLowerCase().includes(query);
      const matchFilter = filter === "All" || p.status === filter;
      return matchSearch && matchFilter;
    });
  }, [patients, search, filter]);

  const openCreate = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  const openEdit = (patient: PatientRecord) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPatient(null);
  };

  const handleSave = async (values: PatientFormValues) => {
    setSaving(true);
    try {
      if (editingPatient) {
        await updatePatient(editingPatient.id, values);
        setPatients((prev) => prev.map((item) => (item.id === editingPatient.id ? { ...item, ...values, updatedAt: new Date() } : item)));
        toast({ title: "Patient updated", description: "Patient record saved successfully." });
      } else {
        const newId = await createPatient(values);
        setPatients((prev) => [{ id: newId, ...values, createdAt: new Date(), updatedAt: new Date() }, ...prev]);
        toast({ title: "Patient created", description: "New patient has been added." });
      }
      closeModal();
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (patient: PatientRecord) => {
    if (!window.confirm(`Delete ${patient.patientName}?`)) return;
    try {
      await deletePatient(patient.id);
      setPatients((prev) => prev.filter((item) => item.id !== patient.id));
      toast({ title: "Patient deleted", description: "Patient record removed." });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  const formatDate = (value?: Date) => {
    if (!value) return "-";
    return value.toISOString().slice(0, 10);
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-surface border border-border rounded-sm px-3 py-1.5 w-72">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none placeholder:text-muted-foreground w-full"
              />
            </div>
            <div className="flex items-center gap-2 bg-surface border border-border rounded-sm px-3 py-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-transparent text-sm outline-none text-foreground">
                <option>All</option>
                <option>Confirmed</option>
                <option>Screening</option>
                <option>High Risk</option>
              </select>
            </div>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-sm text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" />
            Add Patient
          </button>
        </div>

        <div className="clinical-card">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading patients...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient Name</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Age</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gender</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Diagnosis</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Updated</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient) => (
                  <tr key={patient.id} className="table-row-hover">
                    <td className="py-2 px-4 font-mono text-sm text-muted-foreground">{patient.id}</td>
                    <td className="py-2 px-4 text-sm font-medium text-foreground">
                      <Link to={`/patients/${patient.id}`} className="hover:text-primary hover:underline">
                        {patient.patientName}
                      </Link>
                    </td>
                    <td className="py-2 px-4 text-sm text-muted-foreground font-mono">{patient.age}</td>
                    <td className="py-2 px-4 text-sm text-muted-foreground capitalize">{patient.gender}</td>
                    <td className="py-2 px-4 text-sm text-muted-foreground">{patient.diagnosis}</td>
                    <td className="py-2 px-4">
                      <StatusBadge status={patient.status} />
                    </td>
                    <td className="py-2 px-4 font-mono text-sm text-muted-foreground">{formatDate(patient.updatedAt)}</td>
                    <td className="py-2 px-4">
                      <div className="flex gap-1">
                        <button className="p-1 rounded-sm hover:bg-secondary" onClick={() => openEdit(patient)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button className="p-1 rounded-sm hover:bg-secondary text-risk-high" onClick={() => handleDelete(patient)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No patients match your search criteria.</div>}
        </div>
      </div>

      <PatientFormModal
        isOpen={isModalOpen}
        loading={saving}
        onClose={closeModal}
        onSubmit={handleSave}
        initialValues={
          editingPatient
            ? {
                patientName: editingPatient.patientName,
                age: editingPatient.age,
                gender: editingPatient.gender,
                diagnosis: editingPatient.diagnosis,
                status: editingPatient.status,
                notes: editingPatient.notes,
              }
            : null
        }
      />
    </AppLayout>
  );
}