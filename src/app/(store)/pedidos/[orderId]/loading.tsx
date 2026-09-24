import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="px-6 py-8 md:px-16 md:py-12">
      <Skeleton className="mb-6 h-4 w-48" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-32 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-4 w-40" />

      <div className="mt-8 flex flex-col gap-8 md:flex-row">
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-6 w-16" />
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
          <Skeleton className="h-10 rounded-xl" />
        </div>

        <div className="flex w-full flex-col gap-4 md:w-80 md:shrink-0">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
