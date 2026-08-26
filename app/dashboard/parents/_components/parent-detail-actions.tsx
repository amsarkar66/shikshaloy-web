"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, MessageSquare } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { EditParentModal } from "./edit-parent-modal";

export function ParentDetailActions({ parentId, profileId }: { parentId: string; profileId: string | null }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex gap-2">
      {profileId ? (
        <Link
          href={`/dashboard/messages?with=${profileId}`}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" /> Message
        </Link>
      ) : (
        <button
          disabled
          title="This parent doesn't have a login account yet"
          className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-400 dark:text-zinc-600 opacity-60 cursor-not-allowed"
        >
          <MessageSquare className="h-3.5 w-3.5" /> Message
        </button>
      )}
      <FancyButton size="xs" onClick={() => setEditOpen(true)}>
        <Pencil className="h-3.5 w-3.5" /> Edit
      </FancyButton>

      {editOpen && (
        <EditParentModal
          parentId={parentId}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); router.refresh(); }}
        />
      )}
    </div>
  );
}
