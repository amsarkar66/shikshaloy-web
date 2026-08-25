"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { LogoutButton } from "./logout-button";
import { SchoolSwitcher } from "./school-switcher";
import { RELEASES } from "@/lib/changelog";
import { ROLE_META, getNavGroupsForRole } from "../_lib/nav-data";

const TYPE_DOT: Record<string, string> = {
  feat: "bg-emerald-500",
  fix: "bg-amber-500",
  improve: "bg-sky-500",
  docs: "bg-zinc-400",
};

function ReleaseInfo() {
  const release = RELEASES[0];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex shrink-0 -translate-y-px items-center justify-center text-gray-400 dark:text-zinc-600 hover:text-gray-900 dark:hover:text-zinc-50"
        aria-label="Release info"
        aria-expanded={open}
      >
        <Info className="h-[9.5px] w-[9.5px]" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-primary-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-left shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-900 dark:text-zinc-50">v{release.version}</p>
            <p className="text-[10px] text-gray-400 dark:text-zinc-600">{release.date}</p>
          </div>
          <ul className="mt-2 space-y-1.5">
            {release.entries.map((entry, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600 dark:text-zinc-400">
                <span className={`mt-1 h-2 w-0.5 shrink-0 rounded-full ${TYPE_DOT[entry.type]}`} />
                {entry.text}
              </li>
            ))}
          </ul>
          <Link
            href="/changelog"
            target="_blank"
            onClick={() => setOpen(false)}
            className="mt-2.5 block text-[11px] font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            View full changelog
          </Link>
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  role, user, open, onClose, schools, activeSchoolId,
}: {
  role: string;
  user: User;
  open: boolean;
  onClose: () => void;
  schools?: { id: string; name: string }[];
  activeSchoolId?: string | null;
}) {
  const pathname = usePathname();
  const staffTemplateId = user.user_metadata?.staff_template_id as string | undefined;
  const navGroups = getNavGroupsForRole(role, staffTemplateId);
  const meta = ROLE_META[role] ?? ROLE_META.student;
  const roleLabel =
    role === "staff"
      ? (user.user_metadata?.staff_type as string | undefined) ?? meta.label
      : meta.label;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-60 shrink-0 flex-col border-r border-primary-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-transform duration-200 ease-in-out lg:static lg:h-full lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      {/* Logo */}
      <div className="flex h-[60px] shrink-0 items-center gap-2.5 border-b border-primary-100 dark:border-zinc-800 px-5">
        <img src="/logo.svg" alt="" className="h-8 w-8" />
        <div className="flex h-8 flex-1 flex-col justify-center">
          <p className="pt-2 text-sm font-bold leading-none tracking-tight text-gray-900 dark:text-zinc-50">Shikshaloy</p>
          <div className="-mt-0.5 flex items-center gap-[3px]">
            <p className="text-[11px] font-medium leading-[8px] text-gray-400 dark:text-zinc-600">v{RELEASES[0].version}</p>
            <ReleaseInfo />
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-50 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {role === "super_admin" && schools && schools.length > 1 && (
        <div className="border-b border-primary-100 dark:border-zinc-800 pt-3">
          <SchoolSwitcher schools={schools} activeSchoolId={activeSchoolId ?? null} />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {navGroups.map((navGroup, gi) => (
          <div key={gi}>
            {navGroup.group && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                {navGroup.group}
              </p>
            )}
            <div className="space-y-0.5">
              {navGroup.items.map(({ label, href, icon: Icon, badge }) => {
                const active = pathname === href;
                const isSoon = badge === "soon";
                return isSoon ? (
                  <div
                    key={href}
                    className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium opacity-35 text-zinc-500 dark:text-zinc-500"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{label}</span>
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
                      soon
                    </span>
                  </div>
                ) : (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 font-semibold"
                        : "text-zinc-500 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-primary-100 dark:border-zinc-800 p-3">
        <div className="flex items-center justify-center gap-2.5 px-1 py-1">
          <img
            src="/user-profile-icon.svg"
            alt=""
            className="h-7 w-7 shrink-0 rounded-full"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-gray-900 dark:text-zinc-50">
              {(user.user_metadata?.full_name as string) || roleLabel}
            </p>
            <p className="truncate text-[10px] text-primary-500 dark:text-zinc-500">{user.email}</p>
          </div>
          <LogoutButton />
        </div>
      </div>
      </aside>
    </>
  );
}
