import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Brain,
  FileText,
  AlertTriangle,
  Settings,
  Activity,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Patients", path: "/patients", icon: Users },
  { title: "Prediction", path: "/prediction", icon: Brain },
  { title: "Reports", path: "/reports", icon: FileText },
  { title: "Alerts", path: "/alerts", icon: AlertTriangle },
  { title: "Settings", path: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      <div className="h-14 flex items-center gap-2 px-5 border-b border-sidebar-border">
        <Activity className="h-5 w-5 text-sidebar-primary" />
        <span className="font-semibold text-sidebar-accent-foreground text-sm tracking-tight">
          ODSS
        </span>
        <span className="text-[10px] text-sidebar-foreground ml-1 uppercase tracking-widest">
          Oncology
        </span>
      </div>

      <nav className="flex-1 py-3 px-3 space-y-0.5">
        {navItems.map((item) => {
          const active = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors duration-150 ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-sm bg-sidebar-accent flex items-center justify-center text-xs font-medium text-sidebar-accent-foreground">
            DR
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-sidebar-accent-foreground">Dr. R. Chen</span>
            <span className="text-[11px] text-sidebar-foreground">Oncology Dept.</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
