import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Phone, Globe, Users, Briefcase,
  CalendarDays, GraduationCap, Hash, CreditCard, Building2, Landmark,
} from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { getInstitution } from "@/lib/supabase/admin";
import { KERNEL_PERMISSIONS, type KernelPermission } from "@/lib/kernel-permissions";
import { StatusBadge, TypeBadge, BoardBadge, InstitutionActions } from "../_components/institution-ui";
import { DeleteInstitutionButton } from "../_components/delete-institution-modal";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <p className="text-xs text-primary-500 dark:text-zinc-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}

function Section({ title, icon: Icon, action, children }: { title: string; icon: React.ElementType; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary-500" />
          <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{title}</h2>
        </div>
        {action}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{children}</div>
    </div>
  );
}

export default async function InstitutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, { data: { user } }] = await Promise.all([getInstitution(id), getUser()]);
  if (!result) notFound();

  const { institution: inst, subscription } = result;
  const rawPermission = user?.user_metadata?.kernel_permission as string | undefined;
  const permission: KernelPermission = (KERNEL_PERMISSIONS as readonly string[]).includes(rawPermission ?? "")
    ? (rawPermission as KernelPermission)
    : "owner";
  const canDelete = permission === "owner";
  const location = [inst.address, inst.city, inst.state, inst.pin_code, inst.country]
    .filter(Boolean)
    .join(", ");
  const grades = inst.grades_from && inst.grades_to ? `${inst.grades_from} – ${inst.grades_to}` : null;
  const submitted = new Date(inst.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="w-full space-y-6 px-6 py-8">
      <Link href="/dashboard/institutions" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Institutions
      </Link>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-50">{inst.name ?? "—"}</h1>
            <TypeBadge type={inst.institution_type} />
            <BoardBadge board={inst.board} />
            <StatusBadge status={inst.status} />
          </div>
          {inst.tagline && (
            <p className="text-sm italic text-primary-500 dark:text-zinc-500">{inst.tagline}</p>
          )}
          <p className="flex items-center gap-1.5 text-xs text-primary-500 dark:text-zinc-500">
            <CalendarDays className="h-3.5 w-3.5" />
            Submitted {submitted}
            {inst.established_year && ` · Established ${inst.established_year}`}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <InstitutionActions inst={inst} />
          {canDelete && (
            <DeleteInstitutionButton
              institutionId={inst.id}
              institutionName={inst.name}
              schoolCount={inst.schools.length}
            />
          )}
        </div>
      </div>

      {inst.schools.length > 1 && (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Schools ({inst.schools.length})</h2>
          </div>
          <div className="space-y-2">
            {inst.schools.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-50">{s.name}</p>
                  <p className="text-xs text-primary-500 dark:text-zinc-500">
                    {[s.city, s.state].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-gray-200 dark:border-zinc-700 px-2 py-0.5 text-[11px] font-medium capitalize text-gray-500 dark:text-zinc-400">
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Section title="Location" icon={MapPin}>
        <Field label="Address" value={location || "—"} />
        <Field label="City" value={inst.city} />
        <Field label="State" value={inst.state} />
        <Field label="Country" value={inst.country} />
        <Field label="PIN code" value={inst.pin_code} />
      </Section>

      <Section title="Contact" icon={Phone}>
        <Field label="Phone" value={inst.phone} />
        <Field label="Email" value={inst.email} />
        <Field
          label="Website"
          value={
            inst.website ? (
              <a href={inst.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline">
                <Globe className="h-3.5 w-3.5" />
                {inst.website.replace(/^https?:\/\//, "")}
              </a>
            ) : null
          }
        />
      </Section>

      <Section title="Academic" icon={GraduationCap}>
        <Field label="Student range" value={inst.student_range ? <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-primary-500" />{inst.student_range}</span> : null} />
        <Field label="Staff range" value={inst.staff_range ? <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-primary-500" />{inst.staff_range}</span> : null} />
        <Field label="Grades" value={grades} />
        <Field label="UDISE+ code" value={inst.udise_code ? <span className="inline-flex items-center gap-1"><Hash className="h-3.5 w-3.5 text-primary-500" />{inst.udise_code}</span> : null} />
      </Section>

      <Section title="Owner" icon={Building2}>
        <Field label="Name" value={inst.owner_full_name} />
        <Field label="Email" value={inst.owner_email} />
      </Section>

      {(inst.principal_name || inst.principal_email) && (
        <Section title="Principal" icon={Users}>
          <Field label="Name" value={inst.principal_name} />
          <Field label="Designation" value={inst.principal_designation} />
          <Field label="Email" value={inst.principal_email} />
        </Section>
      )}

      {subscription && (
        <Section
          title="Subscription"
          icon={CreditCard}
          action={
            <Link href={`/dashboard/subscriptions/${id}`} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
              Manage subscription
            </Link>
          }
        >
          <Field label="Plan" value={subscription.plan_name} />
          <Field label="Status" value={subscription.status} />
          <Field label="Schools used" value={subscription.max_schools ? `${subscription.schools_used ?? 0} / ${subscription.max_schools}` : subscription.schools_used} />
          <Field label="Monthly fee" value={subscription.monthly_fee != null ? `₹${subscription.monthly_fee.toLocaleString("en-IN")}` : null} />
          <Field label="Renews on" value={subscription.renews_on ? new Date(subscription.renews_on).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null} />
          <Field label="Payment method" value={subscription.payment_method_summary} />
        </Section>
      )}
    </div>
  );
}
