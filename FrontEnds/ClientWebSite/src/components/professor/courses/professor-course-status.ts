import type { CourseListItem } from '@/types';

export type ProfessorCourseStatusLabels = {
  statusPublished: string;
  statusDraft: string;
  statusPendingReview: string;
  statusRejected: string;
};

export function resolveProfessorCourseStatusBadge(
  status: string,
  labels: ProfessorCourseStatusLabels
): { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } {
  switch (status) {
    case 'Published':
      return { label: labels.statusPublished, variant: 'default' };
    case 'PendingReview':
      return { label: labels.statusPendingReview, variant: 'secondary' };
    case 'Rejected':
      return { label: labels.statusRejected, variant: 'destructive' };
    default:
      return { label: labels.statusDraft, variant: 'outline' };
  }
}

export function isProfessorCoursePubliclyLive(status: string) {
  return status === 'Published';
}

export function isProfessorCoursePublishRequested(status: string) {
  return status === 'Published' || status === 'PendingReview' || status === 'Rejected';
}

export function courseShowsRejectionNote(course: CourseListItem) {
  return course.status === 'Rejected' && Boolean(course.moderationRejectionNote?.trim());
}
