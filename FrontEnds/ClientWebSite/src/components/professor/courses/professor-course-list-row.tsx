'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, Heart, Loader2, MessageCircle, Monitor, Pencil, Star, Trash2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CourseCategoryBreadcrumb } from '@/components/shared/course-category-breadcrumb';
import { cn } from '@/lib/utils';
import { getCourseImageUrl } from '@/lib/utils/image-url';
import {
  courseShowsRejectionNote,
  isProfessorCoursePublishRequested,
  resolveProfessorCourseStatusBadge,
  type ProfessorCourseStatusLabels,
} from '@/components/professor/courses/professor-course-status';
import { CoursePriceDisplay } from '@/components/shared/course-price-display';
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

export function ProfessorCourseListRow({
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
    <div className="flex flex-col gap-4 overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md md:flex-row md:items-center">
      <Link href={href} className="group relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-muted md:w-48">
        <Image
          src={getCourseImageUrl(course.titleImage)}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="192px"
          unoptimized
        />
      </Link>
      <div className={cn('min-w-0 flex-1 space-y-2', isRtl ? 'text-right' : 'text-left')}>
        <div className="flex flex-wrap items-center gap-2">
          <CourseCategoryBreadcrumb
            path={course.categoryPath}
            fallbackName={course.categoryName}
            isRtl={isRtl}
            size="xs"
          />
          <Badge variant={statusBadge.variant}>
            {statusBadge.label}
          </Badge>
        </div>
        <Link href={href}>
          <h3 className="text-xl font-bold leading-tight hover:text-primary">{course.title}</h3>
        </Link>
        {courseShowsRejectionNote(course) ? (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">{course.moderationRejectionNote}</AlertDescription>
          </Alert>
        ) : null}
        {course.shortDescription ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{course.shortDescription}</p>
        ) : null}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-4 w-4" />
            {course.studentCount ?? 0} {labels.students}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-4 w-4" />
            {course.commentCount ?? 0} {labels.comments}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {course.likeCount ?? 0} {labels.likes}
          </span>
          <span className="inline-flex items-center gap-1 text-amber-600">
            <Star className="h-4 w-4 fill-current" />
            {(course.rating ?? 0).toFixed(1)} {labels.rating}
          </span>
        </div>
      </div>
      <div className={cn('flex shrink-0 flex-col items-start gap-3 md:items-end', isRtl && 'md:items-start')}>
        <p className="text-xl font-bold text-primary">
        <CoursePriceDisplay
          price={price}
          originalPrice={course.originalPrice}
          lang={isRtl ? 'fa' : 'en'}
          freeLabel={labels.free}
          size="sm"
        />
        </p>
        <div className="flex flex-wrap gap-2">
          {course.deliveryMode === 'desktopLicense' ? (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/professor/courses/${course.id}/desktop`}>
                <Monitor className="h-3.5 w-3.5" />
                {isRtl ? 'لایسنس دسکتاپ' : 'Desktop license'}
              </Link>
            </Button>
          ) : null}
          <Button size="sm" variant="outline" asChild>
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
      </div>
    </div>
  );
}
