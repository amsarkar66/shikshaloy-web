"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./dashboard-header";
import { CommandMenu } from "./command-menu";

export function DashboardShell({
  role, user, orgName, orgLogoUrl, schools, activeSchoolId, children,
}: {
  role: string;
  user: User;
  orgName: string | null;
  orgLogoUrl: string | null;
  schools?: { id: string; name: string }[];
  activeSchoolId?: string | null;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);

  return (
    <div className="dashboard-shell flex h-screen overflow-hidden bg-slate-50 dark:bg-zinc-900 text-gray-900 dark:text-zinc-50 print:h-auto print:overflow-visible">
      <div className="print:hidden">
        <Sidebar
          role={role}
          user={user}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          schools={schools}
          activeSchoolId={activeSchoolId}
        />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible min-w-0">
        <div className="print:hidden">
          <DashboardHeader
            role={role}
            user={user}
            orgName={orgName}
            orgLogoUrl={orgLogoUrl}
            onMenuClick={() => setSidebarOpen(true)}
            onSearchClick={() => setCommandMenuOpen(true)}
          />
        </div>
        <main className="flex-1 overflow-y-auto print:overflow-visible">{children}</main>
      </div>
      <div className="print:hidden">
        <CommandMenu role={role} user={user} open={commandMenuOpen} onOpenChange={setCommandMenuOpen} />
      </div>
    </div>
  );
}
