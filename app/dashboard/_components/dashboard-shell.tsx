"use client";

import { useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { RefreshCcw } from "lucide-react";
import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./dashboard-header";
import { CommandMenu } from "./command-menu";
import { isDemoAccountEmail } from "@/lib/demo/config";

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
  const isDemo = isDemoAccountEmail(user.email);

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
        {isDemo && (
          <div className="print:hidden flex items-center justify-center gap-2 bg-primary-950 px-4 py-2 text-center text-xs font-medium text-primary-100">
            <RefreshCcw className="h-3.5 w-3.5 shrink-0" />
            You&apos;re viewing a live demo — data resets automatically every night.
            <Link href="/" className="ml-1 font-semibold text-white underline underline-offset-2 hover:text-primary-200">
              Back to shikshaloy.com
            </Link>
          </div>
        )}
        <main className="flex-1 overflow-y-auto print:overflow-visible">{children}</main>
      </div>
      <div className="print:hidden">
        <CommandMenu role={role} user={user} open={commandMenuOpen} onOpenChange={setCommandMenuOpen} />
      </div>
    </div>
  );
}
