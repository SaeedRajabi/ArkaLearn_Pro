
import { Skeleton } from '@/components/ui/skeleton';

export default function PlanDetailsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-8 w-1/2" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
