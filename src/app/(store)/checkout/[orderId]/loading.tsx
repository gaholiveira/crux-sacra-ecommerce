import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="px-6 py-8 md:px-16 md:py-12">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-3 h-4 w-64" />

      <div className="mt-8 flex max-w-5xl flex-col gap-10 md:flex-row">
        <div className="flex-1">
          <Skeleton className="h-[420px] rounded-xl" />
        </div>

        <div className="flex w-full flex-col gap-4 md:w-80 md:shrink-0">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
