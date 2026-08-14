"use client";

import { LogOut } from "lucide-react";
import { signOut } from "../actions";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        title="Sign out"
        aria-label="Sign out"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-primary-600 dark:text-zinc-400 transition-colors hover:bg-primary-50 dark:hover:bg-zinc-800 hover:text-primary-800 dark:hover:text-zinc-50"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </form>
  );
}
