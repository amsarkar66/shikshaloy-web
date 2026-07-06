export type AuditAction = "create" | "update" | "delete" | "approve" | "reject" | "login";

export interface AuditEntry {
  id: string;
  actor: string;
  actorRole: string;
  action: AuditAction;
  module: string;
  description: string;
  timestamp: string; // ISO datetime
  ipAddress: string;
}

export const ACTION_BADGE: Record<AuditAction, { label: string; cls: string }> = {
  create:  { label: "Create",  cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  update:  { label: "Update",  cls: "bg-blue-500/10    text-blue-600    dark:text-blue-400    border-blue-500/20"    },
  delete:  { label: "Delete",  cls: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20"     },
  approve: { label: "Approve", cls: "bg-teal-500/10    text-teal-600    dark:text-teal-400    border-teal-500/20"    },
  reject:  { label: "Reject",  cls: "bg-orange-500/10  text-orange-600  dark:text-orange-400  border-orange-500/20"  },
  login:   { label: "Login",   cls: "bg-zinc-500/10    text-zinc-600    dark:text-zinc-400    border-zinc-500/20"    },
};

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
