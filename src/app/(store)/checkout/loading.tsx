import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="px-6 py-8 md:px-16 md:py-12">
      <Skeleton className="h-8 w-48" />

      <div className="mt-8 flex flex-col gap-10 md:flex-row">
        <div className="flex flex-1 flex-col gap-4">
          <Skeleton className="h-6 w-16" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-[#D8CDBC] bg-white p-4">
              <div>
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>

        <div className="flex w-full flex-col gap-4 md:w-80 md:shrink-0">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
