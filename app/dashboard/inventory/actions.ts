"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { resolveAuthorizedSchoolId, assertAuthorizedSchool } from "@/lib/supabase/authorized-school";
import { getUser } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit/log";
import type { ItemCondition, ActivityEventType } from "./_data/inventory";

export interface ItemInput {
  name: string;
  category: string;
  location?: string | null;
  totalQty: number;
  inUse: number;
  damaged: number;
  condition: ItemCondition;
  unitCost: number;
  notes?: string | null;
  schoolId?: string;
}

function validateItemInput(input: ItemInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Item name is required.");
  if (!input.category.trim()) throw new Error("Category is required.");
  if (input.totalQty < 0) throw new Error("Total quantity can't be negative.");
  if (input.inUse < 0 || input.damaged < 0) throw new Error("Quantities can't be negative.");
  if (input.inUse + input.damaged > input.totalQty) throw new Error("In-use + damaged can't exceed total quantity.");
  if (input.unitCost < 0) throw new Error("Unit cost can't be negative.");
  return name;
}

async function logActivity(
  itemId: string,
  schoolId: string,
  eventType: ActivityEventType,
  description: string,
  opts?: { delta?: number; reason?: string }
): Promise<void> {
  const { data: { user } } = await getUser();
  const actorName = (user?.user_metadata?.full_name as string) || user?.email || "Unknown";

  const { error } = await supabaseAdmin.from("inventory_activity_log").insert({
    item_id: itemId,
    school_id: schoolId,
    event_type: eventType,
    description,
    delta: opts?.delta ?? null,
    reason: opts?.reason ?? null,
    actor_name: actorName,
  });
  if (error) throw new Error(error.message);
}

export async function createItem(input: ItemInput): Promise<{ id: string }> {
  const name = validateItemInput(input);
  let schoolId: string;
  if (input.schoolId) {
    const vu = await getVerifiedUser();
    if (!vu) throw new Error("Unauthorized");
    await assertAuthorizedSchool(vu, input.schoolId);
    schoolId = input.schoolId;
  } else {
    schoolId = await getCurrentSchoolIdOrThrow();
  }

  const { data, error } = await supabaseAdmin
    .from("inventory_items")
    .insert({
      school_id: schoolId,
      name,
      category: input.category.trim(),
      location: input.location?.trim() || null,
      total_qty: input.totalQty,
      in_use_qty: input.inUse,
      damaged_qty: input.damaged,
      condition: input.condition,
      unit_cost: input.unitCost,
      notes: input.notes?.trim() || null,
      last_updated: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await logActivity(data.id, schoolId, "created", "Item added to inventory");
  await logAuditEvent({ schoolId, action: "create", module: "Inventory", description: `Added inventory item "${name}"` });

  revalidatePath("/dashboard/inventory");
  return { id: data.id };
}

export interface UpdateItemInput extends ItemInput {
  id: string;
}

export async function updateItem(input: UpdateItemInput): Promise<void> {
  const name = validateItemInput(input);
  const schoolId = await resolveAuthorizedSchoolId("inventory_items", input.id);

  const { error } = await supabaseAdmin
    .from("inventory_items")
    .update({
      name,
      category: input.category.trim(),
      location: input.location?.trim() || null,
      total_qty: input.totalQty,
      in_use_qty: input.inUse,
      damaged_qty: input.damaged,
      condition: input.condition,
      unit_cost: input.unitCost,
      notes: input.notes?.trim() || null,
      last_updated: new Date().toISOString().slice(0, 10),
    })
    .eq("id", input.id)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);

  await logActivity(input.id, schoolId, "updated", "Item details updated");
  await logAuditEvent({ schoolId, action: "update", module: "Inventory", description: `Updated inventory item "${name}"` });

  revalidatePath("/dashboard/inventory");
  revalidatePath(`/dashboard/inventory/${input.id}`);
}

export async function deleteItem(id: string): Promise<void> {
  const schoolId = await resolveAuthorizedSchoolId("inventory_items", id);

  const { data: item } = await supabaseAdmin.from("inventory_items").select("name").eq("id", id).maybeSingle();

  const { error } = await supabaseAdmin
    .from("inventory_items")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);

  await logAuditEvent({ schoolId, action: "delete", module: "Inventory", description: `Removed inventory item "${item?.name ?? id}"` });

  revalidatePath("/dashboard/inventory");
}

export type StockField = "total" | "inUse" | "damaged";

const STOCK_FIELD_LABEL: Record<StockField, string> = {
  total: "Total quantity",
  inUse: "In-use quantity",
  damaged: "Damaged quantity",
};

export async function adjustStock(itemId: string, field: StockField, delta: number, reason: string): Promise<void> {
  if (!Number.isFinite(delta) || delta === 0) throw new Error("Enter a non-zero adjustment amount.");
  if (!reason.trim()) throw new Error("A reason is required for stock adjustments.");

  const schoolId = await resolveAuthorizedSchoolId("inventory_items", itemId);

  const { data: row } = await supabaseAdmin
    .from("inventory_items")
    .select("name, total_qty, in_use_qty, damaged_qty")
    .eq("id", itemId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!row) throw new Error("Item not found");

  const current = { total: row.total_qty as number, inUse: row.in_use_qty as number, damaged: row.damaged_qty as number };
  const next = { ...current, [field]: current[field] + delta };

  if (next.total < 0 || next.inUse < 0 || next.damaged < 0) throw new Error("Quantities can't be negative.");
  if (next.inUse + next.damaged > next.total) throw new Error("In-use + damaged can't exceed total quantity.");

  const { error } = await supabaseAdmin
    .from("inventory_items")
    .update({
      total_qty: next.total,
      in_use_qty: next.inUse,
      damaged_qty: next.damaged,
      last_updated: new Date().toISOString().slice(0, 10),
    })
    .eq("id", itemId)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);

  const reasonTrimmed = reason.trim();
  const direction = delta > 0 ? "increased" : "decreased";
  const description = `${STOCK_FIELD_LABEL[field]} ${direction} by ${Math.abs(delta)} (now ${next[field]})`;

  await logActivity(itemId, schoolId, "stock_adjusted", description, { delta, reason: reasonTrimmed });
  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Inventory",
    description: `Adjusted stock for "${row.name}": ${STOCK_FIELD_LABEL[field]} ${delta > 0 ? "+" : ""}${delta} (${reasonTrimmed})`,
  });

  revalidatePath("/dashboard/inventory");
  revalidatePath(`/dashboard/inventory/${itemId}`);
}

export async function renameCategory(oldName: string, newName: string): Promise<void> {
  const from = oldName.trim();
  const to = newName.trim();
  if (!to) throw new Error("Category name is required.");
  if (from === to) return;
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("inventory_items")
    .update({ category: to })
    .eq("category", from)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/inventory");
}

export async function deleteCategory(name: string, reassignTo: string): Promise<void> {
  const category = name.trim();
  const to = reassignTo.trim();
  if (!to) throw new Error("Choose a category to move items into.");
  if (to === category) throw new Error("Choose a different category to move items into.");
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("inventory_items")
    .update({ category: to })
    .eq("category", category)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/inventory");
}
