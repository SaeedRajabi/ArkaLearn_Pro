
'use client';

import Link from 'next/link';
import type { CourseListItem as CourseListItemType, Dictionary } from '@/types';
import { Badge } from '@/components/ui/badge';
import { CourseCategoryBreadcrumb } from '@/components/shared/course-category-breadcrumb';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { RemoteImage } from '@/components/shared/remote-image';
import { getCourseImageUrl } from '@/lib/utils/image-url';
import { getCourseUrl } from '@/lib/course-slug';
import { CoursePriceDisplay } from '@/components/shared/course-price-display';

function courseLevelToKey(level?: string): 'introductory' | 'intermediate' | 'advanced' {
  if (!level) return 'introductory';
  const l = level.toLowerCase();
  if (l.includes('adv') || l.includes('پیشرفته')) return 'advanced';
  if (l.includes('inter') || l.includes('میان')) return 'intermediate';
  return 'introductory';
}

interface CourseListItemProps {
  course: CourseListItemType;
  dict: Dictionary;
}

export function CourseListItem({ course, dict }: CourseListItemProps) {
  const price = course.price ?? 0;
  const isFree = price === 0;
  const lang = dict.header.courses === 'Courses' ? 'en' : 'fa';
  const isRtl = lang === 'fa';
  const pageDict = dict.coursesPage;
  const levelKey = courseLevelToKey(course.courseLevel);
  const courseUrl = getCourseUrl({ id: course.id, slug: course.slug, title: course.title });

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow duration-300 hover:shadow-xl md:flex-row"
    >
      <div className="relative aspect-video shrink-0 md:w-1/3">
        <RemoteImage
          src={getCourseImageUrl(course.titleImage)}
          alt={course.title}
          fill
          className="object-cover"
          data-ai-hint={course.title}
        />
      </div>
      <div className="flex flex-1 flex-col justify-between p-6">
        <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
                <CourseCategoryBreadcrumb
                  path={course.categoryPath}
                  fallbackName={course.categoryName}
                  isRtl={isRtl}
                  size="xs"
                />
                <Badge variant="outline">{dict.levels[levelKey]}</Badge>
            </div>
            <h3 className="mb-2 text-xl font-bold leading-tight line-clamp-2 font-headline">
                <Link href={courseUrl} className="hover:text-primary transition-colors">
                    {course.title}
                </Link>
            </h3>
            {course.shortDescription && (
              <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                  {course.shortDescription}
              </p>
            )}
             <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span>—</span>
                </div>
                <span className="text-muted-foreground">({course.studentCount} {lang === 'en' ? 'reviews' : 'نظر'})</span>
            </div>
        </div>
        <div className="mt-4 flex items-end justify-between">
            <CoursePriceDisplay
              price={price}
              originalPrice={course.originalPrice}
              lang={lang}
              freeLabel={dict.home.free}
              size="lg"
            />
            <Button asChild size="lg">
                <Link href={courseUrl}>
                    {pageDict.enrollNow}
                </Link>
            </Button>
        </div>
      </div>
    </motion.div>
  );
}
