import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton({
  statCards = 4,
  rows = 8,
}: {
  statCards?: number;
  rows?: number;
}) {
  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: statCards }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="border-b border-zinc-200 dark:border-zinc-800 p-4">
          <Skeleton className="h-9 w-full max-w-sm" />
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <Skeleton className="h-4 flex-1 max-w-[180px]" />
              <Skeleton className="h-4 flex-1 max-w-[100px]" />
              <Skeleton className="h-4 flex-1 max-w-[100px]" />
              <Skeleton className="h-4 flex-1 max-w-[80px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="w-full px-6 py-6 space-y-6">
      <Skeleton className="h-4 w-24" />

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex items-center gap-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="w-full px-6 py-6 flex gap-6">
      <div className="w-52 shrink-0 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div className="flex-1 space-y-5">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
