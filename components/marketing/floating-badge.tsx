"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export function FloatingBadge({
  icon: Icon,
  label,
  className,
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay + 0.5 },
      }}
      className={`absolute z-20 flex items-center gap-2 rounded-full border border-zinc-200 bg-white/95 backdrop-blur px-3.5 py-2 shadow-lg shadow-zinc-300/30 ${className ?? ""}`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50">
        <Icon className="h-3.5 w-3.5 text-primary-600" />
      </span>
      <span className="text-xs font-semibold text-zinc-700 whitespace-nowrap">{label}</span>
    </motion.div>
  );
}
