import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { FancyButton } from "@/components/ui/fancy-button";

// Shared save-transition plumbing for every section editor: each section
// keeps its own local form state and calls `run(value)` on Save, which
// drives pending/error/saved UI the same way across Theme/Header/Footer/etc.
// Refreshes the route on success so PublishBar's draft-vs-published
// comparison (computed from server-fetched props) picks up the change.
export function useDraftSave<T>(save: (value: T) => Promise<void>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function run(value: T) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await save(value);
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return { run, pending, error, saved };
}

export function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">{children}</label>
      {hint && <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">{hint}</p>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-zinc-50 placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400",
        props.className
      )}
    />
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-3">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-zinc-50">{label}</p>
        {description && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function SaveRow({
  pending,
  error,
  saved,
  onSave,
}: {
  pending: boolean;
  error: string | null;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <FancyButton size="sm" onClick={onSave} disabled={pending}>
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Save changes
      </FancyButton>
      {saved && <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Saved to draft</span>}
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
    </div>
  );
}

export function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-50">{title}</h2>
      {description && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}
