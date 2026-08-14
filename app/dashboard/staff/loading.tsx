import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full px-6 py-6 space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Search + filters + actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-9 flex-1 min-w-0 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
        <div className="flex gap-2 sm:ml-auto">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-20 ml-4" />
          <Skeleton className="h-3 w-16 ml-4" />
          <Skeleton className="h-3 w-14 ml-4" />
          <Skeleton className="h-3 w-14 ml-4" />
          <Skeleton className="h-3 w-20 ml-4" />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="space-y-1.5 w-32">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-14" />
              </div>
              <div className="space-y-1.5 w-32 ml-4">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
              <div className="space-y-1.5 w-32 ml-4">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-16 ml-4" />
              <Skeleton className="h-5 w-16 rounded-full ml-4" />
              <Skeleton className="h-4 w-20 rounded-full ml-4" />
              <div className="ml-auto flex gap-1">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
          <Skeleton className="h-3 w-44" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
