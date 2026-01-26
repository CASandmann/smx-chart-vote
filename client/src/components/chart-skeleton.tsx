import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ChartSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex gap-4 p-4">
        <Skeleton className="w-20 h-20 rounded-md flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <Skeleton className="w-9 h-9 rounded-md" />
          <Skeleton className="w-6 h-4" />
          <Skeleton className="w-9 h-9 rounded-md" />
        </div>
      </div>
    </Card>
  );
}

export function ChartListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <ChartSkeleton key={i} />
      ))}
    </div>
  );
}
