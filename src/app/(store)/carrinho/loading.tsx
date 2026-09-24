import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="px-6 py-8 md:px-16 md:py-12">
      <Skeleton className="h-8 w-32" />

      <div className="mt-8 flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-wrap items-center gap-4 rounded-xl border border-[#D8CDBC] bg-white p-4">
            <Skeleton className="h-16 w-16 shrink-0" />
            <div className="min-w-[140px] flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}

        <div className="mt-4 flex items-center justify-between border-t border-[#D8CDBC] pt-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>

        <Skeleton className="mt-4 h-12 w-full rounded-lg sm:w-40 sm:self-end" />
      </div>
    </div>
  );
}
