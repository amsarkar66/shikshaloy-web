"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { publishSite, discardDraft } from "@/lib/site-settings/actions";
import { FancyButton } from "@/components/ui/fancy-button";
import type { SiteSettings } from "@/lib/site-settings/types";

function formatPublishedAt(iso: string | null) {
  if (!iso) return "Never published";
  return `Published ${new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

// Small status caption — meant to sit under the page title.
export function PublishStatus({
  draft,
  published,
  publishedAt,
}: {
  draft: SiteSettings;
  published: SiteSettings | null;
  publishedAt: string | null;
}) {
  const hasUnpublishedChanges = JSON.stringify(draft) !== JSON.stringify(published);
  return (
    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
      {hasUnpublishedChanges ? "You have unpublished changes" : "Everything is published"} ·{" "}
      {formatPublishedAt(publishedAt)}
    </p>
  );
}

// Discard/Publish actions — meant to sit in the header row, to the right
// of the Live Preview button.
export function PublishActions({
  draft,
  published,
  onDiscarded,
}: {
  draft: SiteSettings;
  published: SiteSettings | null;
  onDiscarded?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [discarding, startDiscard] = useTransition();

  const hasUnpublishedChanges = JSON.stringify(draft) !== JSON.stringify(published);

  function handlePublish() {
    startTransition(async () => {
      await publishSite();
      router.refresh();
    });
  }

  function handleDiscard() {
    startDiscard(async () => {
      await discardDraft();
      router.refresh();
      onDiscarded?.();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {hasUnpublishedChanges && published !== null && (
        <button
          onClick={handleDiscard}
          disabled={discarding || pending}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          {discarding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
          Discard draft
        </button>
      )}
      <FancyButton size="sm" onClick={handlePublish} disabled={pending || discarding || !hasUnpublishedChanges}>
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Publish
      </FancyButton>
    </div>
  );
}
