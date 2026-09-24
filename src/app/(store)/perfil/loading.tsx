import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div className="px-6 py-8 md:px-16 md:py-12">
      <Skeleton className="h-8 w-36" />

      <div className="mt-8 flex flex-col gap-1">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="mt-6 h-20 rounded-xl" />
        <Skeleton className="mt-6 h-32 rounded-xl" />
      </div>
    </div>
  );
}
