import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getVerifiedUser, requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow, getInstitutionSchools } from "@/lib/supabase/institution-context";
import InventoryDetailClient from "../_components/InventoryDetailClient";
import { toItem, ITEM_SELECT, type ItemRow, type ActivityLogEntry } from "../_data/inventory";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins and lab staff can manage inventory.</p>
      </div>
    </div>
  );
}

interface ActivityRow {
  id: string;
  event_type: string;
  description: string;
  delta: number | null;
  reason: string | null;
  actor_name: string;
  created_at: string;
}

export default async function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await requireRoleOrStaffTemplate(["admin", "super_admin"], ["lab_assistant"]);
  } catch {
    return <Unauthorized />;
  }

  const verifiedUser = await getVerifiedUser();

  let schoolId: string;
  let schoolName: string | undefined;

  if (verifiedUser?.role === "super_admin") {
    const { data: itemLookup } = await supabaseAdmin.from("inventory_items").select("school_id").eq("id", id).maybeSingle();
    if (!itemLookup) notFound();

    const institutionId = await getCurrentInstitutionIdOrThrow();
    const schools = await getInstitutionSchools(institutionId);
    const school = schools.find((s) => s.id === itemLookup.school_id);
    if (!school) notFound();

    schoolId = itemLookup.school_id;
    schoolName = school.name;
  } else {
    schoolId = await getCurrentSchoolIdOrThrow();
  }

  const [{ data: itemRow }, { data: activityRows }, { data: categoryRows }] = await Promise.all([
    supabaseAdmin.from("inventory_items").select(ITEM_SELECT).eq("id", id).eq("school_id", schoolId).maybeSingle(),

    supabaseAdmin
      .from("inventory_activity_log")
      .select("id, event_type, description, delta, reason, actor_name, created_at")
      .eq("item_id", id)
      .order("created_at", { ascending: false })
      .limit(50),

    supabaseAdmin.from("inventory_items").select("category").eq("school_id", schoolId),
  ]);

  if (!itemRow) notFound();

  const item = toItem(itemRow as ItemRow, schoolName);

  const activity: ActivityLogEntry[] = ((activityRows ?? []) as ActivityRow[]).map((a) => ({
    id: a.id,
    eventType: a.event_type as ActivityLogEntry["eventType"],
    description: a.description,
    delta: a.delta,
    reason: a.reason,
    actorName: a.actor_name,
    createdAt: a.created_at,
  }));

  const categories = Array.from(
    new Set(((categoryRows ?? []) as { category: string | null }[]).map((c) => c.category).filter((c): c is string => Boolean(c)))
  ).sort();

  return <InventoryDetailClient item={item} activity={activity} categories={categories} />;
}
