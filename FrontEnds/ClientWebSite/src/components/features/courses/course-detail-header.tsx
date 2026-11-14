import { Star, Users, BarChart3, Info, Globe } from 'lucide-react';
import { CourseCategoryBreadcrumb } from '@/components/shared/course-category-breadcrumb';
import type { Course } from '@/types';
import { cn } from '@/lib/utils';
import { pageLayout } from '@/lib/utils/page-layout';

type DictSlice = {
  courseDetailsPage: {
    students: string;
    lastUpdated: string;
  };
  levels: Record<string, string>;
};

interface CourseDetailHeaderProps {
  course: Course;
  dict: DictSlice;
  lang: 'en' | 'fa';
}

export function CourseDetailHeader({ course, dict, lang }: CourseDetailHeaderProps) {
  const title = lang === 'en' ? course.title_en : course.title;
  const description = lang === 'en' ? course.description_en : course.description;
  const pageDict = dict.courseDetailsPage;

  return (
    <div className={pageLayout.pageHeaderBand}>
      <div
        className={cn(
          'container mx-auto px-4 py-12 text-center',
          lang === 'fa' ? 'md:text-right' : 'md:text-start'
        )}
      >
        <CourseCategoryBreadcrumb
          path={course.categoryPath}
          fallbackName={course.category}
          isRtl={lang === 'fa'}
          size="md"
          className="mb-4 justify-center md:justify-start"
        />
        <h1 className="font-headline text-3xl font-bold md:text-4xl">{title}</h1>
        <p className="mx-auto mt-2 max-w-3xl text-muted-foreground md:mx-0">{description}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground md:justify-start">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span>{course.rating.toFixed(1)}/5.0</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>
              {course.reviews} {pageDict.students}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span>{dict.levels[course.level]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Info className="h-4 w-4" />
            <span>
              {pageDict.lastUpdated}{' '}
              {new Date(course.lastUpdated).toLocaleDateString(lang === 'en' ? 'en-US' : 'fa-IR')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="h-4 w-4" />
            <span>{lang === 'en' ? course.language : 'فارسی'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
