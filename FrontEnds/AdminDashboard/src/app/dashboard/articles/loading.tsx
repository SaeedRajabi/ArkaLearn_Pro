
import { Skeleton } from '@/components/ui/skeleton';

export default function ArticlesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
