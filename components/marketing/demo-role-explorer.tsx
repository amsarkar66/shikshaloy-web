"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_ACCOUNTS } from "@/lib/demo/config";
import { DemoLoginButton } from "@/components/marketing/demo-login-button";
import { StoreIconButtons } from "@/components/marketing/store-badges";

// A macOS-style browser window, cropped the same way as the screenshot below
// it: only the top-left of the full chrome bar is in view, so the URL pill
// sits right-of-center (not centered) and the tab/download/new-page icons
// that would sit further right are out of frame entirely.
function DashboardPreview() {
  return (
    <div className="relative w-full h-full rounded-tl-2xl bg-zinc-900 shadow-xl shadow-zinc-900/10 overflow-hidden flex flex-col">
      <div className="shrink-0 h-[42px] flex items-center gap-3 px-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 flex justify-end min-w-0 pr-2">
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] text-zinc-300 max-w-[220px] w-full">
            <Lock className="h-2.5 w-2.5 text-zinc-500 shrink-0" />
            <span className="truncate">shikshaloy.com/dashboard</span>
            <RotateCw className="h-2.5 w-2.5 text-zinc-500 shrink-0 ml-auto" />
          </div>
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
    const applyHash = (scroll: boolean) => {
      const hash = window.location.hash.replace("#", "");
      if (DEMO_ACCOUNTS.some((a) => a.slug === hash)) {
        setActiveSlug(hash);
        if (scroll) {
          document.getElementById("role-explorer")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };
    applyHash(false);
    const onHashChange = () => applyHash(true);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
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
                "inline-flex items-center gap-2 h-11 rounded-full border pl-2.5 pr-4 text-sm font-medium transition-all duration-200 ease-out active:translate-y-0 active:shadow-sm",
                isActive
                  ? "border-primary-300 bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-500/20 -translate-y-0.5"
                  : "border-zinc-200 bg-white text-zinc-600 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-zinc-300 hover:text-zinc-900 hover:shadow-sm hover:-translate-y-0.5"
              )}
            >
              <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full shadow-[0_2px_4px_-1px_rgba(0,0,0,0.18)] ring-1", account.accent, account.ring)}>
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
          <div className="lg:w-[320px] shrink-0 p-8 lg:p-10 lg:border-r border-zinc-100 flex flex-col">
            <span className={cn("inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-5", account.accent)}>
              <account.icon className="h-7 w-7" />
            </span>
            <h3 className="text-2xl font-bold text-zinc-900">{account.label}</h3>
            <p className="mt-3 text-[15px] text-zinc-500 leading-relaxed">{account.pitch}</p>
            <ul className="mt-8 space-y-4">
              {account.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2.5 text-[15px] text-zinc-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-400 shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8 border-t border-zinc-100 flex items-center gap-2">
              <DemoLoginButton
                email={account.email}
                password={account.password}
                label={account.label}
                className="flex-1"
              />
              <StoreIconButtons />
            </div>
          </div>

          <div className="flex-1 h-[320px] sm:h-[420px] lg:h-[648px] pt-6 pl-6 lg:pt-8 lg:pl-8 bg-gradient-to-br from-zinc-50 to-white">
            <DashboardPreview />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
