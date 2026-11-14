
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight xs:text-3xl"><Skeleton className="h-8 w-1/3" /></h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-[432px] w-full" />
        </div>
        <div>
          <Skeleton className="h-[432px] w-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </div>
  );
}
