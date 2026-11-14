import { Skeleton } from '@/components/ui/skeleton';

/** Keep dashboard chrome filled while the account page RSC streams in. */
export default function AccountDashboardLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
