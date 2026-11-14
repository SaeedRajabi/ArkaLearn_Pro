import { Skeleton } from '@/components/ui/skeleton';

export function HomeSkeleton() {
  return (
    <>
      {/* Hero Section Skeleton */}
      <section className="w-full overflow-hidden bg-background">
        <div className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center gap-1 px-4 py-0 md:flex-row lg:gap-20">
          <div className="w-full md:w-5/12 space-y-6">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <div className="flex gap-4 mt-10">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
          <div className="w-full md:w-7/12">
            <Skeleton className="aspect-square w-full rounded-2xl" />
          </div>
        </div>
      </section>

      {/* Courses Section Skeleton */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <Skeleton className="mb-4 h-8 w-32 rounded-full" />
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-12 w-72 max-w-full" />
              <Skeleton className="h-5 w-96 max-w-full" />
            </div>
            <Skeleton className="h-11 w-44 rounded-full" />
          </div>
          <Skeleton className="rounded-3xl p-4">
            <div className="mb-6 flex justify-center">
              <Skeleton className="h-11 w-72 rounded-full" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          </Skeleton>
        </div>
      </section>

      {/* Seminars Carousel Section Skeleton */}
      <section className="bg-muted/30 overflow-hidden">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <div className="text-center space-y-4 mb-12">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="min-w-[300px] space-y-4">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Section Skeleton */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <Skeleton className="mb-4 h-8 w-32 rounded-full" />
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-12 w-72 max-w-full" />
              <Skeleton className="h-5 w-96 max-w-full" />
            </div>
            <Skeleton className="h-11 w-44 rounded-full" />
          </div>
          <Skeleton className="rounded-3xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-4">
              <Skeleton className="min-h-[18rem] lg:col-span-2 rounded-2xl" />
              <Skeleton className="min-h-[18rem] lg:col-span-2 lg:row-span-2 rounded-2xl" />
              <Skeleton className="min-h-[18rem] rounded-2xl" />
              <Skeleton className="min-h-[18rem] rounded-2xl" />
            </div>
          </Skeleton>
        </div>
      </section>

      {/* Projects Section Skeleton */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <Skeleton className="mb-4 h-8 w-32 rounded-full" />
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-12 w-72 max-w-full" />
              <Skeleton className="h-5 w-96 max-w-full" />
            </div>
            <Skeleton className="h-11 w-44 rounded-full" />
          </div>
          <div className="mb-10 grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
            <Skeleton className="min-h-[22rem] rounded-3xl" />
            <div className="grid gap-4">
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-36 rounded-2xl" />
            </div>
          </div>
          <div className="mt-10 flex justify-center gap-2">
            <Skeleton className="h-10 w-56 rounded-full" />
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
