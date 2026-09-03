"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { resolveAuthorizedSchoolId, assertAuthorizedSchool } from "@/lib/supabase/authorized-school";
import type { ItemCondition } from "./_data/inventory";

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

  revalidatePath("/dashboard/inventory");
}

export async function deleteItem(id: string): Promise<void> {
  const schoolId = await resolveAuthorizedSchoolId("inventory_items", id);

  const { error } = await supabaseAdmin
    .from("inventory_items")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/inventory");
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
