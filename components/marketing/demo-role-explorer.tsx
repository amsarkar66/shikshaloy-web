"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, RotateCw, Download, Plus, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_ACCOUNTS } from "@/lib/demo/config";
import { DemoLoginButton } from "@/components/marketing/demo-login-button";

// A macOS-style browser window: dark rounded bezel, traffic lights, a fake
// URL pill, and window-chrome icons — wraps the real screenshot, which is
// zoomed 166.67% (showing its top-left 60%) and anchored top-left.
function DashboardPreview() {
  return (
    <div className="relative w-full h-full rounded-tl-2xl bg-zinc-900 shadow-xl shadow-zinc-900/10 overflow-hidden flex flex-col">
      <div className="shrink-0 flex items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 flex justify-center min-w-0">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] text-zinc-300 max-w-[220px] w-full">
            <Lock className="h-3 w-3 text-zinc-500 shrink-0" />
            <span className="truncate">shikshaloy.com/dashboard</span>
            <RotateCw className="h-3 w-3 text-zinc-500 shrink-0 ml-auto" />
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2.5 text-zinc-500 shrink-0">
          <Download className="h-3.5 w-3.5" />
          <Plus className="h-3.5 w-3.5" />
          <Copy className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/demo-dashboard-preview.png"
          alt="Shikshaloy dashboard preview"
          className="absolute top-0 left-0 h-auto max-w-none select-none pointer-events-none"
          style={{ width: `${100 / 0.6}%` }}
        />
      </div>
    </div>
  );
}

export function DemoRoleExplorer() {
  const [activeSlug, setActiveSlug] = useState(DEMO_ACCOUNTS[0].slug);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (DEMO_ACCOUNTS.some((a) => a.slug === hash)) {
      setActiveSlug(hash);
    }
  }, []);

  const select = (slug: string) => {
    setActiveSlug(slug);
    window.history.replaceState(null, "", `#${slug}`);
  };

  const account = DEMO_ACCOUNTS.find((a) => a.slug === activeSlug)!;

  return (
    <div id="role-explorer">
      {/* Pill tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {DEMO_ACCOUNTS.map((account) => {
          const isActive = account.slug === activeSlug;
          return (
            <button
              key={account.slug}
              onClick={() => select(account.slug)}
              className={cn(
                "inline-flex items-center gap-2 h-11 rounded-full border pl-2.5 pr-4 text-sm font-medium transition-all",
                isActive
                  ? "border-primary-300 bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-500/20"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
              )}
            >
              <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full", account.accent)}>
                <account.icon className="h-3.5 w-3.5" />
              </span>
              {account.label}
            </button>
          );
        })}
      </div>

      {/* Expanded preview for the selected role only */}
      <motion.div
        key={account.slug}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="rounded-3xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/60 overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-[320px] shrink-0 p-7 lg:border-r border-zinc-100 flex flex-col">
            <span className={cn("inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-4", account.accent)}>
              <account.icon className="h-6 w-6" />
            </span>
            <h3 className="text-xl font-bold text-zinc-900">{account.label}</h3>
            <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{account.pitch}</p>
            <ul className="mt-5 space-y-2.5">
              {account.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm text-zinc-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-400 shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-zinc-100">
              <DemoLoginButton email={account.email} password={account.password} label={account.label} />
            </div>
          </div>

          <div className="flex-1 min-h-[320px] pt-6 pl-6 lg:pt-8 lg:pl-8 bg-gradient-to-br from-zinc-50 to-white">
            <DashboardPreview />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
