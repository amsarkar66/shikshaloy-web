import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full px-6 py-6 space-y-5">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-3 w-72" />
      </div>

      {/* Stat cards (Students / Staff / Parents / Admins) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 px-4 py-3">
            <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-3 w-14" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-1.5 px-3.5 py-2.5">
            <Skeleton className="h-3.5 w-3.5" />
            <Skeleton className="h-3.5 w-14" />
          </div>
        ))}
      </div>

      {/* Search + school filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-9 flex-1 min-w-0 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Table (Student · School · Class · Roll No. · Phone · Status) */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20 ml-4" />
          <Skeleton className="h-3 w-12 ml-4" />
          <Skeleton className="h-3 w-14 ml-4" />
          <Skeleton className="h-3 w-14 ml-4" />
          <Skeleton className="h-3 w-14 ml-auto" />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-24 ml-4" />
              <Skeleton className="h-3.5 w-14 ml-4" />
              <Skeleton className="h-3.5 w-12 ml-4" />
              <Skeleton className="h-3.5 w-20 ml-4" />
              <Skeleton className="h-5 w-16 rounded-full ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
