"use client";

import { useState } from "react";
import { CheckCircle2, KeyRound, Copy } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import type { EnrollResult } from "../actions";

export function CredentialsDialog({ result, studentName, onClose }: { result: EnrollResult; studentName: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copyAll() {
    let text = `Student login\nEmail: ${result.loginEmail}\nPassword: ${result.loginPassword}`;
    if (result.parentLogin) {
      text += `\n\nParent login\nEmail: ${result.parentLogin.email}\nPassword: ${result.parentLogin.password}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-5 w-5"/></div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Student enrolled</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{studentName} · Roll No {result.rollNo}</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Student login</p>
        <div className="mt-1.5 space-y-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 p-3">
          <div className="flex items-center gap-2 text-xs">
            <KeyRound className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 shrink-0"/>
            <span className="text-gray-500 dark:text-zinc-400 w-16 shrink-0">Email</span>
            <span className="font-mono text-gray-800 dark:text-zinc-200 truncate">{result.loginEmail}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <KeyRound className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 shrink-0"/>
            <span className="text-gray-500 dark:text-zinc-400 w-16 shrink-0">Password</span>
            <span className="font-mono text-gray-800 dark:text-zinc-200">{result.loginPassword}</span>
          </div>
        </div>

        {result.parentLogin && (
          <>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Parent login</p>
            <div className="mt-1.5 space-y-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 p-3">
              <div className="flex items-center gap-2 text-xs">
                <KeyRound className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 shrink-0"/>
                <span className="text-gray-500 dark:text-zinc-400 w-16 shrink-0">Email</span>
                <span className="font-mono text-gray-800 dark:text-zinc-200 truncate">{result.parentLogin.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <KeyRound className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 shrink-0"/>
                <span className="text-gray-500 dark:text-zinc-400 w-16 shrink-0">Password</span>
                <span className="font-mono text-gray-800 dark:text-zinc-200">{result.parentLogin.password}</span>
              </div>
            </div>
          </>
        )}

        <p className="mt-3 text-[11px] text-gray-400 dark:text-zinc-500">Share these with the student/parent — they won&apos;t be shown again.</p>
        <div className="mt-4 flex gap-2">
          <button onClick={copyAll} className="flex flex-1 h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
            <Copy className="h-3.5 w-3.5"/>{copied?"Copied!":"Copy credentials"}
          </button>
          <FancyButton onClick={onClose} size="sm" className="flex-1">Done</FancyButton>
        </div>
      </div>
    </div>
  );
}
