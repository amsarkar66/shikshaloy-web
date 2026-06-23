"use client";

import { LogOut } from "lucide-react";
import { signOut } from "../actions";

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-indigo-600 dark:text-zinc-400 transition-colors hover:bg-indigo-50 dark:hover:bg-zinc-800 hover:text-indigo-800 dark:hover:text-zinc-50"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}
