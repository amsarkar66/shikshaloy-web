"use client";

import { useState } from "react";
import { CommandMenu } from "../dashboard/_components/command-menu";
import type { User } from "@supabase/supabase-js";

const mockUser = {
  id: "preview-user-id",
  email: "preview@shikshaloy.test",
  user_metadata: { full_name: "Preview User" },
} as unknown as User;

export default function CmdkPreviewPage() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("admin");

  return (
    <div className="p-10 space-y-4">
      <h1 className="text-lg font-bold">Command Menu Preview</h1>
      <div className="flex gap-2">
        {["kernel", "super_admin", "admin", "teacher", "parent", "student", "driver"].map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded border px-2 py-1 text-sm ${role === r ? "bg-black text-white" : ""}`}
          >
            {r}
          </button>
        ))}
      </div>
      <p>Current role: {role}</p>
      <button onClick={() => setOpen(true)} className="rounded border px-3 py-1.5">
        Open Command Menu (⌘K)
      </button>
      <CommandMenu role={role} user={mockUser} open={open} onOpenChange={setOpen} />
    </div>
  );
}
