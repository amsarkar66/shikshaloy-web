"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";

export const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 text-sm text-gray-900 dark:text-zinc-100 placeholder:font-medium placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

// AlignUI "fancy button" recipe: a soft drop shadow plus a 1px ring drawn via
// box-shadow (not `border`), so the ring can share the button's own fill color.
const buttonBaseClass =
  "inline-flex h-10 w-full items-center justify-center gap-3 rounded-[10px] px-3.5 text-sm font-medium tracking-[-0.006em] shadow-[0_1px_2px_0_rgba(14,18,27,0.24)] transition duration-200 ease-out";
export const buttonPrimaryClass = `${buttonBaseClass} bg-primary-500 text-white ring-1 ring-primary-500 hover:bg-primary-600 hover:ring-primary-600 disabled:opacity-60`;
export const buttonStrokeClass = `${buttonBaseClass} bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-700 disabled:opacity-60`;

// AlignUI "shadow-regular-xs" surface recipe: 24px radius, 24px padding, a
// near-invisible shadow instead of a border, sections stacked with a flat gap.
export const cardClass =
  "flex w-full flex-col gap-5 rounded-3xl bg-white p-6 shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] dark:border dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none";

export function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#4285F4"
        d="M23.52 12.273c0-.851-.076-1.67-.218-2.455H12v4.645h6.458c-.278 1.5-1.126 2.77-2.4 3.622v3.011h3.885c2.273-2.093 3.583-5.176 3.583-8.823z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.956-1.075 7.943-2.905l-3.885-3.01c-1.076.72-2.454 1.146-4.058 1.146-3.123 0-5.767-2.108-6.712-4.943H1.28v3.107C3.256 21.31 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.288 14.288A7.21 7.21 0 0 1 4.909 12c0-.794.137-1.567.38-2.288V6.605H1.28A11.996 11.996 0 0 0 0 12c0 1.937.464 3.77 1.28 5.395l4.008-3.107z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.762 0 3.344.606 4.59 1.795l3.444-3.444C17.951 1.19 15.236 0 12 0 7.31 0 3.256 2.69 1.28 6.605l4.008 3.107C6.233 6.877 8.877 4.77 12 4.77z"
      />
    </svg>
  );
}

export function AnimatedCheckCircle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
      <motion.path
        d="M7.5 12.5l2.75 2.75L16.5 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.25, delay: 0.25, ease: "easeOut" }}
      />
    </svg>
  );
}

export function OtpInput({
  value,
  onChange,
  length = 6,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = (index: number) => {
    inputsRef.current[Math.max(0, Math.min(index, length - 1))]?.focus();
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = (value.slice(0, index) + (digit || " ") + value.slice(index + 1))
      .slice(0, length)
      .replace(/ /g, "");
    onChange(next);
    if (digit && index < length - 1) focusInput(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      onChange(value.slice(0, index - 1) + value.slice(index));
      focusInput(index - 1);
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusInput(pasted.length - 1);
  };

  return (
    <div className="flex gap-1">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="h-12 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white text-center text-lg font-semibold text-gray-900 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
      ))}
    </div>
  );
}

export function FieldLabel({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">{label}</label>
      {action}
    </div>
  );
}

export function AuthChrome({
  children,
  maxWidthClassName = "max-w-[400px]",
}: {
  children: React.ReactNode;
  maxWidthClassName?: string;
}) {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-gray-100 p-4 dark:bg-black">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 dark:hidden"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 60% 55% at 50% 45%, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 55% at 50% 45%, black 0%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 hidden dark:block"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 60% 55% at 50% 45%, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 55% at 50% 45%, black 0%, transparent 75%)",
        }}
      />

      <Link
        href="/"
        className="absolute left-4 top-4 z-10 flex items-center gap-2 sm:left-6 sm:top-6"
      >
        <img src="/logo.svg" alt="" className="h-6 w-6" />
        <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
          Shikshaloy
        </span>
      </Link>

      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`relative z-10 w-full ${maxWidthClassName}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
