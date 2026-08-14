import type { ReactNode } from "react";

// Shared list-table shell. Change header/row/cell styling here once and every
// table built on these primitives picks it up — instead of each dashboard
// list page carrying its own copy of the same Tailwind classes.

function cellPadding(position?: "first" | "last") {
  if (position === "first") return "py-3 pl-4 pr-3";
  if (position === "last") return "py-3 pl-3 pr-4";
  return "px-3 py-3";
}

function textAlign(align?: "left" | "center" | "right") {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

export function Table({
  header, footer, children,
}: {
  header?: ReactNode; footer?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      {header}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
      {footer}
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">{children}</tr>
    </thead>
  );
}

export function Th({
  children, position, align = "left",
}: {
  children?: ReactNode; position?: "first" | "last"; align?: "left" | "center" | "right";
}) {
  return (
    <th
      className={`${cellPadding(position)} ${textAlign(align)} text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 whitespace-nowrap`}
    >
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">{children}</tbody>;
}

export function Tr({
  children, className = "", onClick,
}: {
  children: ReactNode; className?: string; onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </tr>
  );
}

export function Td({
  children, position, align = "left", className = "",
}: {
  children?: ReactNode; position?: "first" | "last"; align?: "left" | "center" | "right"; className?: string;
}) {
  return (
    <td className={`${cellPadding(position)} ${textAlign(align)} ${className}`}>
      {children}
    </td>
  );
}

export function TableEmptyRow({
  colSpan, icon: Icon, message,
}: {
  colSpan: number; icon?: React.ElementType; message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-20 text-center">
        <div className="flex flex-col items-center gap-2">
          {Icon && <Icon className="h-8 w-8 text-gray-300 dark:text-zinc-600" />}
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">{message}</p>
        </div>
      </td>
    </tr>
  );
}

export function TableTitleHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700/50">
      <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{title}</p>
      {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{subtitle}</p>}
    </div>
  );
}
