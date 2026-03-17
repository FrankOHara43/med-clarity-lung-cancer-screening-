import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Download } from "lucide-react";
import { subscribeReports, type ReportRecord } from "@/services/reportService";
import { toast } from "@/components/ui/use-toast";

function StatusBadge({ status }: { status: string }) {
  const styles = status === "Flagged"
    ? "bg-risk-high/10 text-risk-high border-risk-high/20"
    : status === "Pending Review"
      ? "bg-risk-med/10 text-risk-med border-risk-med/20"
      : "bg-risk-low/10 text-risk-low border-risk-low/20";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium border ${styles}`}>{status}</span>;
}

function downloadTextFile(report: ReportRecord) {
  const content = `Report ID: ${report.reportId}\nPatient: ${report.patient}\nType: ${report.type}\nDate: ${report.date}\nStatus: ${report.status}\nPhysician: ${report.physician}\nPrediction: ${report.prediction}\nConfidence: ${report.confidence}%\n\nNotes:\n${report.notes ?? ""}\n`;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report.reportId}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeReports(
      (rows) => {
        setReports(rows);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        toast({
          variant: "destructive",
          title: "Failed to load reports",
          description: error.message || "Unexpected error",
        });
      }
    );

    return () => unsubscribe();
  }, []);

  const previews = useMemo(() => reports.slice(0, 4), [reports]);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="clinical-card">
          <div className="clinical-card-header">
            <span className="clinical-card-title">All Reports</span>
            <span className="text-xs text-muted-foreground">{reports.length} total</span>
          </div>
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading reports...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Report ID</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Physician</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prediction</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confidence</th>
                  <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.reportId} className="table-row-hover">
                    <td className="py-2 px-4 font-mono text-sm text-muted-foreground">{r.reportId}</td>
                    <td className="py-2 px-4 text-sm font-medium text-foreground">{r.patient}</td>
                    <td className="py-2 px-4 text-sm text-muted-foreground">{r.type}</td>
                    <td className="py-2 px-4 font-mono text-sm text-muted-foreground">{r.date || "-"}</td>
                    <td className="py-2 px-4"><StatusBadge status={r.status} /></td>
                    <td className="py-2 px-4 text-sm text-muted-foreground">{r.physician}</td>
                    <td className="py-2 px-4 text-sm text-muted-foreground">{r.prediction || "—"}</td>
                    <td className="py-2 px-4 font-mono text-sm text-muted-foreground">{Number.isFinite(r.confidence) ? `${r.confidence}%` : "—"}</td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => {
                          downloadTextFile(r);
                          toast({ title: "Download started", description: `Saved ${r.reportId}.txt` });
                        }}
                        className="p-1.5 rounded-sm hover:bg-secondary transition-colors"
                      >
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && reports.length === 0 && <div className="p-4 text-sm text-muted-foreground">No reports available.</div>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {previews.map((r) => (
            <div key={r.reportId} className="clinical-card">
              <div className="clinical-card-header">
                <span className="clinical-card-title">{r.type}</span>
                <StatusBadge status={r.status} />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">{r.patient}</span>
                  <span className="font-mono text-muted-foreground text-xs">{r.date || "-"}</span>
                </div>
                <p className="text-sm text-muted-foreground">Prediction: {r.prediction} • Confidence: {r.confidence}%</p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">{r.physician}</span>
                  <button
                    onClick={() => {
                      downloadTextFile(r);
                      toast({ title: "Downloaded", description: `${r.reportId}.txt generated.` });
                    }}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Download className="h-3 w-3" /> Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}