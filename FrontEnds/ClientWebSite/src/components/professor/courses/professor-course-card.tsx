'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, Heart, Loader2, MessageCircle, Monitor, Pencil, Star, Trash2, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { CourseCategoryBreadcrumb } from '@/components/shared/course-category-breadcrumb';
import { CoursePriceDisplay } from '@/components/shared/course-price-display';
import {
  courseShowsRejectionNote,
  isProfessorCoursePublishRequested,
  resolveProfessorCourseStatusBadge,
  type ProfessorCourseStatusLabels,
} from '@/components/professor/courses/professor-course-status';
import { cn } from '@/lib/utils';
import { getCourseImageUrl } from '@/lib/utils/image-url';
import type { CourseListItem } from '@/types';

type Props = {
  course: CourseListItem;
  href: string;
  isRtl?: boolean;
  labels: ProfessorCourseStatusLabels & {
    students: string;
    comments: string;
    likes: string;
    rating: string;
    free: string;
    view: string;
    edit: string;
    delete: string;
    publish: string;
    unpublish: string;
    rejectionNoteTitle: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  deleting?: boolean;
  togglingPublish?: boolean;
};

export function ProfessorCourseCard({
  course,
  href,
  isRtl,
  labels,
  onEdit,
  onDelete,
  onTogglePublish,
  deleting = false,
  togglingPublish = false,
}: Props) {
  const price = course.price ?? 0;
  const isFree = price === 0;
  const isPublished = isProfessorCoursePublishRequested(course.status);
  const statusBadge = resolveProfessorCourseStatusBadge(course.status, labels);

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardHeader className="p-0">
        <Link href={href} className="group block">
          <div className="relative aspect-video overflow-hidden bg-muted">
            <Image
              src={getCourseImageUrl(course.titleImage)}
              alt={course.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
              unoptimized
            />
            <Badge
              className={cn('absolute top-3', isRtl ? 'left-3' : 'right-3')}
              variant={statusBadge.variant}
            >
              {statusBadge.label}
            </Badge>
          </div>
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <CourseCategoryBreadcrumb
            path={course.categoryPath}
            fallbackName={course.categoryName}
            isRtl={isRtl}
            size="xs"
          />
          <Link href={href}>
            <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-snug hover:text-primary">{course.title}</h3>
          </Link>
        </div>
        {course.shortDescription ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.shortDescription}</p>
        ) : null}
        {courseShowsRejectionNote(course) ? (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">{course.moderationRejectionNote}</AlertDescription>
          </Alert>
        ) : null}
        <div className="mt-auto grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {course.studentCount ?? 0} {labels.students}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {course.commentCount ?? 0} {labels.comments}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {course.likeCount ?? 0} {labels.likes}
          </span>
          <span className="inline-flex items-center gap-1 text-amber-600">
            <Star className="h-3.5 w-3.5 fill-current" />
            {(course.rating ?? 0).toFixed(1)} {labels.rating}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t p-4 pt-3">
        <CoursePriceDisplay
          price={price}
          originalPrice={course.originalPrice}
          lang={isRtl ? 'fa' : 'en'}
          freeLabel={labels.free}
          size="md"
        />
        <div className="flex w-full flex-wrap gap-2">
          {course.deliveryMode === 'desktopLicense' ? (
            <Button size="sm" variant="outline" className="gap-1.5" asChild>
              <Link href={`/professor/courses/${course.id}/desktop`}>
                <Monitor className="h-3.5 w-3.5" />
                {isRtl ? 'لایسنس دسکتاپ' : 'Desktop license'}
              </Link>
            </Button>
          ) : null}
          <Button size="sm" variant="outline" className="gap-1.5" asChild>
            <Link href={href}>{labels.view}</Link>
          </Button>
          <Button size="sm" variant="secondary" className="gap-1.5" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
            {labels.edit}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={togglingPublish}
            onClick={onTogglePublish}
          >
            {togglingPublish ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isPublished ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            {isPublished ? labels.unpublish : labels.publish}
          </Button>
          <Button size="sm" variant="destructive" className="gap-1.5" disabled={deleting} onClick={onDelete}>
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            {labels.delete}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
