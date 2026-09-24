import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-[#D8CDBC] bg-white p-4">
        <Skeleton className="h-[58px] w-full rounded-md sm:w-56" />
        <Skeleton className="h-[58px] w-full rounded-md sm:w-56" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D8CDBC] bg-white p-6">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
