'use client';

import * as React from 'react';
import { ProfessorCourseForm as ProfessorCourseFormBase } from '@/components/professor/courses/admin-ported/course-form-base';
import { ProfessorAdminLanguageProvider } from '@/components/professor/courses/admin-ported/professor-admin-language-provider';
import { useAuth } from '@/contexts/auth-context';
import { searchCategories } from '@/lib/api/categories';
import {
  addProfessorCourse,
  updateProfessorCourse,
  type ProfessorCourseFormPayload,
} from '@/lib/api/professor-courses';
import type { CourseQri } from '@/lib/api/types';
import type { ProfessorAdminCourse } from '@/lib/professor-course-types';
import { canEditLifecycleSchedule } from '@/lib/course-lifecycle-ui';
import { toUserFacingMessage } from '@/lib/errors/user-facing-message';

type CourseDetailsForm = Parameters<
  React.ComponentProps<typeof ProfessorCourseFormBase>['onSave']
>[0];

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapCourseQriToAdminCourse(course: CourseQri): ProfessorAdminCourse {
  const raw = course as CourseQri & Record<string, unknown>;
  const levelRaw = String(raw.levelCode ?? raw.LevelCode ?? course.level ?? 'beginner')
    .trim()
    .toLowerCase();
  const level =
    levelRaw === 'intermediate' || levelRaw.includes('میان')
      ? 'intermediate'
      : levelRaw === 'advanced' || levelRaw.includes('پیشرفته')
        ? 'advanced'
        : levelRaw === 'beginner' || levelRaw.includes('مبتدی') || levelRaw.length > 0
          ? 'beginner'
          : 'beginner';
  const languageRaw = String(raw.language ?? raw.Language ?? 'fa').trim().toLowerCase();
  const language = languageRaw === 'en' || languageRaw.includes('انگلیسی') ? 'en' : 'fa';

  return {
    id: String(course.courseId),
    title: course.title,
    description: course.description ?? '',
    shortDescription: course.shortDescription ?? '',
    category: String(course.categoryId ?? ''),
    price: Number(course.price ?? 0),
    originalPrice: course.originalPrice != null && course.originalPrice > 0 ? Number(course.originalPrice) : undefined,
    paymentType: course.paymentType === 'installment' ? 'installment' : 'cash',
    installmentPlans:
      course.paymentType === 'installment' && course.installmentPlans?.length
        ? course.installmentPlans.map((p) => ({
            installmentNumber: p.installmentNumber,
            amountToman: Number(p.amountToman) || 0,
            dueDateUtc: p.dueDateUtc ?? null,
          }))
        : undefined,
    level,
    language,
    status: course.isPublish ? 'Published' : 'Draft',
    thumbnailUrl: course.thumbnailUrl,
    videoUrl: course.videoUrl,
    tags: course.tags ?? course.courseTags ?? [],
    prerequisites: '',
    faqs: (course.faqs ?? []).map((faq, index) => ({
      id: newId(`faq-${index}`),
      question: faq.question ?? '',
      answer: faq.answer ?? '',
    })),
    sections: (course.sections ?? []).map((section, sectionIndex) => ({
      id:
        section.sessionId != null &&
        String(section.sessionId).trim() !== '' &&
        Number(section.sessionId) > 0
          ? String(section.sessionId)
          : newId(`sec-${sectionIndex}`),
      title: section.sessionTitle,
      lessons: (section.courseLessons ?? []).map((lesson) => {
        const lessonRaw = lesson as typeof lesson & Record<string, unknown>;
        const mediaAssetId = lessonRaw.mediaAssetId ?? lessonRaw.MediaAssetId;
        return {
          id:
            lesson.lessonId != null && Number(lesson.lessonId) > 0
              ? String(lesson.lessonId)
              : newId('les'),
          title: lesson.lessonTitle,
          videoTitle: lesson.videoTitle,
          videoUrl: lesson.videoUrl,
          durationSeconds: lesson.durationSeconds,
          hasVideo: lesson.hasVideo ?? (!!lesson.videoUrl || !!mediaAssetId),
          mediaAssetId: mediaAssetId != null && Number(mediaAssetId) > 0 ? Number(mediaAssetId) : undefined,
          isPublished: lesson.isPublished === true,
        };
      }),
    })),
    degreeRequired: course.isCertificate,
    deliveryMode: (() => {
      const rawMode = String(course.deliveryMode ?? 'directDownload').toLowerCase();
      if (rawMode === 'desktoplicense' || rawMode === 'desktop' || rawMode === '2') return 'desktopLicense';
      if (rawMode === 'spotplayerlicense' || rawMode === 'spotplayer' || rawMode === '1') return 'desktopLicense';
      return 'directDownload';
    })(),
    lifecyclePhase: course.lifecyclePhase ?? 'notStarted',
    registrationClosed: course.isRegistrationClosed === true,
    registrationDeadlineUtc: course.registrationDeadlineUtc,
    courseStartUtc: course.courseStartUtc,
    courseEndUtc: course.courseEndUtc,
    seoTitle: course.seoTitle ?? null,
    metaDescription: course.metaDescription ?? null,
    ogImageUrl: course.ogImageUrl ?? null,
  };
}

function mapFormToPayload(
  values: CourseDetailsForm,
  seo?: { seoTitle?: string; metaDescription?: string; ogImageUrl?: string }
): ProfessorCourseFormPayload {
  const scheduleEditable = canEditLifecycleSchedule(values.lifecyclePhase);
  return {
    title: values.title.trim(),
    shortDescription: values.shortDescription.trim(),
    description: values.description,
    level: values.level,
    price: values.price,
    originalPrice: values.originalPrice && values.originalPrice > 0 ? values.originalPrice : undefined,
    paymentType: values.paymentType === 'installment' ? 'installment' : 'cash',
    installmentPlans:
      values.paymentType === 'installment'
        ? (values.installmentPlans ?? []).map((p) => ({
            installmentNumber: p.installmentNumber,
            amountToman: Number(p.amountToman) || 0,
            dueDateUtc: p.dueDateUtc ?? null,
          }))
        : undefined,
    category: values.category,
    status: values.status,
    degreeRequired: values.degreeRequired,
    tags: values.tags,
    prerequisites: values.prerequisites,
    faqs: values.faqs.filter((faq) => faq.question.trim() && faq.answer.trim()),
    sections: values.sections.map((section) => ({
      id: section.id,
      title: section.title,
      lessons: section.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        videoTitle: lesson.videoTitle,
        videoUrl: lesson.videoUrl,
        durationSeconds: lesson.durationSeconds,
        videoFile: lesson.videoFile instanceof File ? lesson.videoFile : undefined,
        mediaAssetId: lesson.mediaAssetId,
        removeVideo: lesson.removeVideo,
        isPublished: values.lifecyclePhase === 'inProgress' ? lesson.isPublished === true : undefined,
      })),
    })),
    thumbnailUrl: values.thumbnailUrl,
    videoUrl: values.videoUrl,
    introVideoDurationSeconds: values.introVideoDurationSeconds,
    deliveryMode: values.deliveryMode,
    lifecyclePhase: values.lifecyclePhase,
    registrationClosed: values.registrationClosed === true,
    registrationDeadlineUtc: scheduleEditable ? values.registrationDeadlineUtc : undefined,
    courseStartUtc: scheduleEditable ? values.courseStartUtc : undefined,
    courseEndUtc: scheduleEditable ? values.courseEndUtc : undefined,
    seoTitle: seo?.seoTitle || null,
    metaDescription: seo?.metaDescription || null,
    ogImageUrl: seo?.ogImageUrl || null,
  };
}

type Props = {
  courseToEdit?: CourseQri | null;
  loadingCourse?: boolean;
  onCancel: () => void;
  onSaved: () => void;
  variant?: 'page' | 'modal';
  open?: boolean;
};

function ProfessorCourseFormInner({
  courseToEdit,
  loadingCourse = false,
  onCancel,
  onSaved,
  variant = 'page',
  open = false,
}: Props) {
  const { user } = useAuth();
  const [categories, setCategories] = React.useState<{ categoryId: string; categoryName: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = React.useState(false);

  React.useEffect(() => {
    if (variant === 'modal' && !open) return;

    let cancelled = false;
    setLoadingCategories(true);
    searchCategories({ pageSize: 200 })
      .then((rows) => {
        if (cancelled) return;
        setCategories(
          rows.map((row) => ({
            categoryId: String(row.id),
            categoryName: row.categoryName,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false);
      });
    return () => {
      cancelled = true;
    };
  }, [variant, open]);

  const mappedCourse = React.useMemo(
    () => (courseToEdit ? mapCourseQriToAdminCourse(courseToEdit) : null),
    [courseToEdit]
  );

  const handleSave = React.useCallback(
    async (values: CourseDetailsForm, seo?: { seoTitle?: string; metaDescription?: string; ogImageUrl?: string }) => {
      if (!user?.id) {
        return {
          ok: false,
          message: toUserFacingMessage('Please sign in.', 'error', 'لطفاً وارد حساب کاربری شوید.'),
        };
      }
      const payload = mapFormToPayload(values, seo);
      if (courseToEdit) {
        return updateProfessorCourse(courseToEdit.courseId, payload, user.id);
      }
      return addProfessorCourse(payload, user.id);
    },
    [courseToEdit, user?.id]
  );

  return (
    <ProfessorCourseFormBase
      course={mappedCourse}
      loading={loadingCourse || loadingCategories}
      categories={categories}
      onCancel={onCancel}
      onSaved={onSaved}
      onSave={handleSave}
      variant={variant}
      open={open}
    />
  );
}

export function ProfessorCourseForm(props: Props) {
  return (
    <ProfessorAdminLanguageProvider>
      <ProfessorCourseFormInner {...props} />
    </ProfessorAdminLanguageProvider>
  );
}
