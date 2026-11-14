
import { Skeleton } from '@/components/ui/skeleton';

export default function CourseDetailsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-8 w-1/3" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
