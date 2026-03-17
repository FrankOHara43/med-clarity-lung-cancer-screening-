import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "@/components/ui/use-toast";

type NotificationPrefs = {
  highRiskAlerts: boolean;
  reportCompletion: boolean;
  maintenanceUpdates: boolean;
};

const PREFERENCES_KEY = "odss_notification_preferences";

export default function SettingsPage() {
  const { user } = useAuth();
  const [institution, setInstitution] = useState("Metro General Hospital");
  const [department, setDepartment] = useState("Oncology");
  const [preferences, setPreferences] = useState<NotificationPrefs>({
    highRiskAlerts: true,
    reportCompletion: true,
    maintenanceUpdates: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as NotificationPrefs;
      setPreferences(parsed);
    } catch {
      localStorage.removeItem(PREFERENCES_KEY);
    }
  }, []);

  const userInitials = useMemo(() => {
    const source = user?.displayName || user?.email || "DR";
    return source
      .split(" ")
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const toggle = (key: keyof NotificationPrefs) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = async () => {
    if (!institution.trim() || !department.trim()) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Institution and department are required.",
      });
      return;
    }

    setSaving(true);
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
      await new Promise((resolve) => setTimeout(resolve, 300));
      toast({ title: "Settings saved", description: "Your preferences have been updated." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6">
        <div className="clinical-card">
          <div className="clinical-card-header">
            <span className="clinical-card-title">General Settings</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Institution</span>
              <input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="text-sm font-medium text-foreground bg-transparent text-right border-b border-border/60 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Department</span>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="text-sm font-medium text-foreground bg-transparent text-right border-b border-border/60 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">System Version</span>
              <span className="text-sm font-medium text-foreground">ODSS v2.4.1</span>
            </div>
          </div>
        </div>

        <div className="clinical-card">
          <div className="clinical-card-header">
            <span className="clinical-card-title">Notification Preferences</span>
          </div>
          <div className="p-4 space-y-3">
            {[
              { key: "highRiskAlerts", label: "High-risk case alerts" },
              { key: "reportCompletion", label: "Report completion notifications" },
              { key: "maintenanceUpdates", label: "System maintenance updates" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => toggle(item.key as keyof NotificationPrefs)}
                className="w-full flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer"
              >
                <span className="text-sm text-foreground">{item.label}</span>
                <div className={`h-5 w-9 rounded-full relative ${preferences[item.key as keyof NotificationPrefs] ? "bg-primary" : "bg-muted"}`}>
                  <div
                    className={`h-4 w-4 rounded-full bg-primary-foreground absolute top-0.5 transition-all ${
                      preferences[item.key as keyof NotificationPrefs] ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="clinical-card">
          <div className="clinical-card-header">
            <span className="clinical-card-title">User Profile</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-sm bg-muted flex items-center justify-center text-lg font-semibold text-foreground">{userInitials}</div>
              <div>
                <p className="text-sm font-semibold text-foreground">{user?.displayName || "Doctor"}</p>
                <p className="text-xs text-muted-foreground">{user?.email || "No email"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Email", value: user?.email || "-" },
                { label: "Phone", value: "-" },
                { label: "License", value: "-" },
                { label: "Specialization", value: department },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{f.label}</p>
                  <p className="text-sm text-foreground">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}