
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { pageLayout } from '@/lib/utils/page-layout';

const CourseDetailHeaderSkeleton = () => {
    return (
        <div className={pageLayout.pageHeaderBand}>
            <div className="container mx-auto px-4 py-12 text-center md:text-start">
                <Skeleton className="h-6 w-24 mb-4 mx-auto md:mx-0" />
                <Skeleton className="h-10 w-3/4 md:w-1/2 mb-2 mx-auto md:mx-0" />
                <Skeleton className="h-5 w-full max-w-2xl mx-auto md:mx-0" />
                <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-32" />
                </div>
            </div>
        </div>
    );
};

export default function Loading() {
  return (
    <>
      <CourseDetailHeaderSkeleton />
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2">
             <div className="w-full">
              <div className="grid w-full grid-cols-3 md:grid-cols-6 mb-8 gap-1">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
              <div className="space-y-8">
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-8 w-1/3" />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                        </div>
                    </CardContent>
                </Card>
                
                <div className="space-y-4">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar Skeleton */}
          <div className="relative order-first lg:order-last">
            <div className="sticky top-24 space-y-6">
              <Card className="overflow-hidden shadow-2xl">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-6">
                    <div className="mb-4 space-y-2">
                        <Skeleton className="h-9 w-1/3" />
                        <Skeleton className="h-6 w-1/2" />
                    </div>

                  <div className="space-y-3">
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-11 w-full" />
                  </div>

                  <Separator className='my-6' />

                  <Skeleton className="h-7 w-1/2 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>

                  <Separator className="my-6" />

                  <Skeleton className="h-7 w-1/4 mb-4" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                  </div>

                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
