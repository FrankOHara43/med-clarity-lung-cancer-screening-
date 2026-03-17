import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Users, ClipboardList, FileText, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getPatients, type PatientRecord } from "@/services/patientService";
import { getReports } from "@/services/reportService";
import { getAlerts } from "@/services/alertService";
import { toast } from "@/components/ui/use-toast";

function StatusDot({ status }: { status: string }) {
  const color = status === "Confirmed" ? "bg-foreground" : status === "High Risk" ? "bg-risk-high" : "bg-muted-foreground";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color} mr-2`} />;
}

export default function DashboardPage() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [reportCount, setReportCount] = useState(0);
  const [openAlertCount, setOpenAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [patientData, reportData, alertData] = await Promise.all([getPatients(), getReports(), getAlerts()]);
        setPatients(patientData);
        setReportCount(reportData.length);
        setOpenAlertCount(alertData.filter((a) => a.state === "open" || a.state === "review").length);
      } catch (error: unknown) {
        toast({
          variant: "destructive",
          title: "Dashboard load failed",
          description: error instanceof Error ? error.message : "Unexpected error",
        });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const pendingScreenings = useMemo(() => patients.filter((p) => p.status === "Screening").length, [patients]);
  const highRisk = useMemo(() => patients.filter((p) => p.status === "High Risk").length, [patients]);
  const recentPatients = useMemo(() => patients.slice(0, 7), [patients]);

  const stats = [
    { label: "Total Patients", value: String(patients.length), delta: `${recentPatients.length} recent`, deltaUp: true, icon: Users },
    { label: "Pending Screenings", value: String(pendingScreenings), delta: "Needs follow-up", deltaUp: pendingScreenings > 0, icon: ClipboardList },
    { label: "Reviewed Reports", value: String(reportCount), delta: "Live from backend", deltaUp: true, icon: FileText },
    { label: "High-Risk Cases", value: String(highRisk), delta: `${openAlertCount} active alerts`, deltaUp: highRisk > 0, icon: AlertTriangle, urgent: true },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="clinical-card">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</span>
                  <s.icon className={`h-4 w-4 ${s.urgent ? "text-risk-high" : "text-muted-foreground"}`} />
                </div>
                <div className="text-2xl font-semibold text-foreground font-mono">{loading ? "..." : s.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {s.deltaUp ? <ArrowUpRight className={`h-3 w-3 ${s.urgent ? "text-risk-high" : "text-risk-low"}`} /> : <ArrowDownRight className="h-3 w-3 text-risk-low" />}
                  <span className={`text-xs ${s.urgent ? "text-risk-high font-medium" : "text-muted-foreground"}`}>{s.delta}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 clinical-card">
            <div className="clinical-card-header">
              <span className="clinical-card-title">Recent Patient Activity</span>
              <Link to="/patients" className="text-xs text-primary hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Age/Sex</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPatients.map((p) => (
                    <tr key={p.id} className="table-row-hover">
                      <td className="py-2 px-4 font-mono text-sm text-muted-foreground">{p.id}</td>
                      <td className="py-2 px-4 text-sm font-medium text-foreground">{p.patientName}</td>
                      <td className="py-2 px-4 text-sm text-muted-foreground">{p.age} / {p.gender}</td>
                      <td className="py-2 px-4 text-sm">
                        <StatusDot status={p.status} />
                        <span className={p.status === "High Risk" ? "text-risk-high font-medium" : "text-foreground"}>{p.status}</span>
                      </td>
                      <td className="py-2 px-4 font-mono text-sm text-muted-foreground">{p.updatedAt ? p.updatedAt.toISOString().slice(0, 10) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && recentPatients.length === 0 && <div className="p-4 text-sm text-muted-foreground">No patient activity yet.</div>}
            </div>
          </div>

          <div className="col-span-4 clinical-card">
            <div className="clinical-card-header">
              <span className="clinical-card-title">Flagged Cases</span>
              <Link to="/alerts" className="text-xs text-primary hover:underline">View All</Link>
            </div>
            <div className="divide-y divide-border">
              {patients
                .filter((p) => p.status === "High Risk")
                .slice(0, 3)
                .map((p) => (
                  <div key={p.id} className="p-4 hover:bg-secondary transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium bg-risk-high/10 text-risk-high border border-risk-high/20">
                        Critical
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{p.patientName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.id}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.diagnosis || "High-risk case pending review."}</p>
                  </div>
                ))}
              {!loading && highRisk === 0 && <div className="p-4 text-sm text-muted-foreground">No flagged cases right now.</div>}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}