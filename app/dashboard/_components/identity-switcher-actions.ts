"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getActiveIdentity, ACTIVE_IDENTITY_COOKIE } from "@/lib/identity/context";

export async function setActiveIdentity(key: string): Promise<{ error?: string }> {
  const active = await getActiveIdentity();
  if (!active) return { error: "Unauthorized." };
  if (!active.identities.some((i) => i.key === key)) {
    return { error: "That identity isn't available on this account." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_IDENTITY_COOKIE, key, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard");
  return {};
}
