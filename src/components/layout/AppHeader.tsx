import { Search, Bell, LogOut, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "@/components/ui/use-toast";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/patients": "Patient Registry",
  "/prediction": "Cancer Prediction",
  "/reports": "Reports",
  "/alerts": "Alerts",
  "/settings": "Settings",
};

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const title = pageTitles[location.pathname] || "ODSS";

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to logout",
      });
    }
  };

  const getUserInitials = () => {
    if (!user) return "?";
    return (user.email || user.displayName || "U")
      .split("@")[0]
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
        <span className="text-xs text-muted-foreground">Oncology Decision Support System</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-secondary rounded-sm px-3 py-1.5 w-64">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patient (⌘K)"
            className="bg-transparent text-sm outline-none placeholder:text-muted-foreground w-full"
          />
        </div>
        <button onClick={() => navigate("/alerts")} className="relative p-2 rounded-sm hover:bg-secondary transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-risk-high" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="h-8 w-8 rounded-sm bg-primary flex items-center justify-center text-[11px] font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            title={user?.email || "User"}
          >
            {getUserInitials()}
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-sm shadow-lg z-40">
              <div className="p-3 border-b border-border">
                <p className="text-xs font-medium text-foreground truncate">{user?.email || "User"}</p>
                <p className="text-xs text-muted-foreground">Connected</p>
              </div>
              <button
                onClick={() => {
                  navigate("/settings");
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors rounded-b-sm"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Click outside to close menu */}
        {showMenu && (
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowMenu(false)}
          />
        )}
      </div>
    </header>
  );
}
