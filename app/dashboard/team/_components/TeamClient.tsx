"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { UserCog, Mail, UserPlus, Loader2, Shield, X, Crown, ShieldCheck, Eye, ChevronDown, Lock } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, Th, TableBody, Tr, Td, TableEmptyRow } from "@/components/ui/data-table";
import { inviteTeamMember } from "../actions";
import type { KernelUser } from "@/lib/supabase/admin";
import { KERNEL_PERMISSIONS, KERNEL_PERMISSION_LABELS, type KernelPermission } from "@/lib/kernel-permissions";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const PERMISSION_ICON: Record<KernelPermission, React.ElementType> = {
  owner: Crown,
  admin: ShieldCheck,
  viewer: Eye,
};

const PERMISSION_STYLE: Record<KernelPermission, string> = {
  owner: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  admin: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  viewer: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
};

const PERMISSION_DESCRIPTION: Record<KernelPermission, string> = {
  owner: "Full access, including inviting and managing the platform team.",
  admin: "Can manage institutions, billing, and support — not the team roster.",
  viewer: "Read-only access to the dashboard.",
};

function PermissionBadge({ permission }: { permission: KernelPermission }) {
  const Icon = PERMISSION_ICON[permission];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${PERMISSION_STYLE[permission]}`}>
      <Icon className="h-3 w-3" />
      {KERNEL_PERMISSION_LABELS[permission]}
    </span>
  );
}

function InviteButton() {
  const { pending } = useFormStatus();
  return (
    <FancyButton type="submit" disabled={pending} size="sm">
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
      {pending ? "Inviting…" : "Invite"}
    </FancyButton>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<KernelPermission>("admin");

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      await inviteTeamMember(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite team member");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Invite to platform team</p>
              <p className="text-xs text-primary-500 dark:text-zinc-500">Grant dashboard access at the permission level you choose.</p>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-zinc-400">Invite members</label>
            <div className="flex flex-col divide-y sm:flex-row sm:divide-x sm:divide-y-0 divide-gray-200 dark:divide-zinc-700 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 transition-colors focus-within:border-primary-400 dark:focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20">
              <input
                name="fullName"
                required
                placeholder="Full name"
                className="h-9 w-full min-w-0 sm:w-36 bg-transparent px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Email address"
                className="h-9 w-full min-w-0 flex-1 bg-transparent px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none"
              />
              <div className="relative flex items-center">
                <Lock className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-primary-400 dark:text-zinc-500" />
                <select
                  name="permission"
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as KernelPermission)}
                  className="h-9 w-full min-w-0 sm:w-32 cursor-pointer appearance-none bg-transparent py-0 pl-8 pr-7 text-sm text-gray-900 dark:text-zinc-100 outline-none"
                >
                  {KERNEL_PERMISSIONS.map((p) => (
                    <option key={p} value={p} className="bg-white text-gray-900 dark:bg-zinc-800 dark:text-zinc-100">
                      {KERNEL_PERMISSION_LABELS[p]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-primary-400 dark:text-zinc-500" />
              </div>
            </div>
            <p className="mt-1.5 text-xs text-primary-500 dark:text-zinc-500">{PERMISSION_DESCRIPTION[permission]}</p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <InviteButton />
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TeamClient({
  members,
  currentUserId,
  currentPermission,
}: {
  members: KernelUser[];
  currentUserId: string;
  currentPermission: KernelPermission;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const canInvite = currentPermission === "owner";

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Platform Team</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Shikshaloy product owner accounts</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div>
          <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-zinc-50">Invite a platform teammate</h2>
          <p className="text-xs text-primary-500 dark:text-zinc-500">
            {canInvite
              ? "Choose a permission level, and they'll get an emailed temporary password."
              : "Only Owners can invite new teammates."}
          </p>
        </div>
        {canInvite && (
          <FancyButton size="sm" onClick={() => setModalOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" />
            Invite teammate
          </FancyButton>
        )}
      </div>

      {modalOpen && <InviteModal onClose={() => setModalOpen(false)} />}

      <Table>
        <TableHead>
          <Th position="first">Member</Th>
          <Th>Email</Th>
          <Th>Permission</Th>
          <Th>Joined</Th>
          <Th position="last">Last active</Th>
        </TableHead>
        <TableBody>
          {members.length === 0 ? (
            <TableEmptyRow colSpan={5} icon={UserCog} message="No platform team members yet." />
          ) : (
            members.map((m) => (
              <Tr key={m.id}>
                <Td position="first">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-[11px] font-bold text-indigo-500">
                      {initials(m.full_name || m.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">
                        {m.full_name || "—"}
                        {m.id === currentUserId && (
                          <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-primary-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                            <Shield className="h-2.5 w-2.5" /> you
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td className="text-sm text-primary-600 dark:text-zinc-400">
                  <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-primary-500" />{m.email}</span>
                </Td>
                <Td><PermissionBadge permission={m.permission} /></Td>
                <Td className="text-sm text-primary-500 dark:text-zinc-500">{formatDate(m.created_at)}</Td>
                <Td position="last" className="text-sm text-primary-500 dark:text-zinc-500">
                  {m.last_sign_in_at ? formatDate(m.last_sign_in_at) : "Never"}
                </Td>
              </Tr>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
