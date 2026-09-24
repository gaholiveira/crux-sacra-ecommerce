import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="px-6 py-6 md:px-16 md:py-8">
      <Skeleton className="mb-6 h-4 w-40" />

      <div className="flex flex-col gap-8 md:flex-row md:gap-14">
        <Skeleton className="h-[280px] w-full shrink-0 rounded-2xl md:h-[520px] md:w-[520px]" />

        <div className="flex max-w-xl flex-1 flex-col gap-5">
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="mt-2 h-12 w-48 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
