
import { Skeleton } from '@/components/ui/skeleton';

export default function UserDetailsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-8 w-1/3" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="lg:col-span-1 h-48" />
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
