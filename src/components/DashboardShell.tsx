import type { ReactNode } from "react";

interface DashboardShellProps {
  rail: ReactNode;
  themeControl: ReactNode;
  children: ReactNode;
}

export function DashboardShell({ rail, themeControl, children }: DashboardShellProps) {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Stock Dashboard</h1>
        {themeControl}
      </header>
      <div className="dashboard-workspace">
        {rail}
        <main className="dashboard-panes">{children}</main>
      </div>
    </div>
  );
}
