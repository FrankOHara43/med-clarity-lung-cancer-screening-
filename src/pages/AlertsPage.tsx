import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { getAlerts, type AlertRecord, updateAlertState } from "@/services/alertService";
import { toast } from "@/components/ui/use-toast";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAlerts();
        setAlerts(data);
      } catch (error: unknown) {
        toast({
          variant: "destructive",
          title: "Failed to load alerts",
          description: error instanceof Error ? error.message : "Unexpected error",
        });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const urgentAlerts = useMemo(() => alerts.filter((a) => a.state === "open"), [alerts]);
  const reviewQueue = useMemo(() => alerts.filter((a) => a.state === "review"), [alerts]);
  const recentlyResolved = useMemo(() => alerts.filter((a) => a.state === "resolved" || a.state === "dismissed").slice(0, 6), [alerts]);

  const changeState = async (id: string, state: AlertRecord["state"]) => {
    try {
      await updateAlertState(id, state);
      setAlerts((prev) => prev.map((item) => (item.id === id ? { ...item, state, updatedAt: new Date() } : item)));
      toast({ title: "Alert updated", description: `Alert marked as ${state}.` });
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-risk-high flex items-center gap-2 mb-3">
            <AlertTriangle className="h-3.5 w-3.5" /> Urgent Alerts ({urgentAlerts.length})
          </h2>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading alerts...</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {urgentAlerts.map((a) => (
                <div key={a.id} className="clinical-card border-risk-high/30">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium bg-risk-high/10 text-risk-high border border-risk-high/20">
                        {a.severity}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{a.updatedAt ? a.updatedAt.toISOString().slice(0, 10) : "-"}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{a.patientName}</p>
                      <p className="text-xs font-mono text-muted-foreground">{a.patientId}</p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{a.reason}</p>
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => changeState(a.id, "review")}
                        className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-sm text-xs font-medium hover:opacity-90 transition-opacity"
                      >
                        Review Case
                      </button>
                      <button
                        onClick={() => changeState(a.id, "dismissed")}
                        className="px-3 py-1.5 bg-secondary text-foreground rounded-sm text-xs font-medium hover:bg-muted transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {urgentAlerts.length === 0 && <div className="text-sm text-muted-foreground">No urgent alerts.</div>}
            </div>
          )}
        </div>

        <div className="clinical-card">
          <div className="clinical-card-header">
            <span className="clinical-card-title flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> Doctor Review Queue
            </span>
            <span className="text-xs text-muted-foreground">{reviewQueue.length} pending</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient</th>
                <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID</th>
                <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</th>
                <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned</th>
                <th className="text-left py-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {reviewQueue.map((r) => (
                <tr key={r.id} className="table-row-hover">
                  <td className="py-2 px-4 text-sm font-medium text-foreground">{r.patientName}</td>
                  <td className="py-2 px-4 font-mono text-sm text-muted-foreground">{r.patientId}</td>
                  <td className="py-2 px-4 text-sm text-muted-foreground">{r.reason}</td>
                  <td className="py-2 px-4 text-sm text-muted-foreground">{r.assignedTo || "Unassigned"}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => changeState(r.id, "resolved")}
                      className="px-2 py-1 text-xs rounded-sm bg-secondary hover:bg-muted"
                    >
                      Mark Resolved
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reviewQueue.length === 0 && <div className="p-4 text-sm text-muted-foreground">No items in review queue.</div>}
        </div>

        <div className="clinical-card">
          <div className="clinical-card-header">
            <span className="clinical-card-title flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" /> Recently Resolved
            </span>
          </div>
          <div className="divide-y divide-border">
            {recentlyResolved.map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.patientName} <span className="font-mono text-muted-foreground text-xs ml-2">{r.patientId}</span></p>
                  <p className="text-sm text-muted-foreground">{r.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{r.assignedTo || "System"}</p>
                  <p className="text-xs font-mono text-muted-foreground">{r.updatedAt ? r.updatedAt.toISOString().slice(0, 10) : "-"}</p>
                </div>
              </div>
            ))}
            {recentlyResolved.length === 0 && <div className="p-4 text-sm text-muted-foreground">No resolved alerts yet.</div>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}