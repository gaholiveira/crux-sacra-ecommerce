import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-3 h-4 w-32" />
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 mb-8 h-4 w-72" />

      <div className="flex max-w-xl flex-col gap-6 rounded-xl border border-[#D8CDBC] bg-white p-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-md" />
        ))}
        <Skeleton className="h-24 rounded-md" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    </div>
  );
}
