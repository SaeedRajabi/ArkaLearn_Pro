'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const GRID_COLUMNS: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
};

function GridCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <div className="bg-gradient-to-b from-muted/80 to-muted/30 px-4 pb-5 pt-8">
        <div className="mx-auto flex flex-col items-center">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="mt-4 h-5 w-32" />
          <Skeleton className="mt-2 h-4 w-24" />
          <Skeleton className="mt-3 h-6 w-16 rounded-full" />
        </div>
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex flex-wrap gap-3 border-t pt-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

function ListCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="flex flex-wrap gap-3 pt-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="shrink-0 space-y-2 md:text-end">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

type Props = {
  layout: 'grid' | 'list';
  columns?: number;
  count?: number;
};

export function AdvertisementsLoading({ layout, columns = 3, count = 6 }: Props) {
  if (layout === 'list') {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading advertisements">
        {Array.from({ length: count }).map((_, i) => (
          <ListCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('grid gap-6', GRID_COLUMNS[columns] ?? GRID_COLUMNS[3])}
      aria-busy="true"
      aria-label="Loading advertisements"
    >
      {Array.from({ length: count }).map((_, i) => (
        <GridCardSkeleton key={i} />
      ))}
    </div>
  );
}
