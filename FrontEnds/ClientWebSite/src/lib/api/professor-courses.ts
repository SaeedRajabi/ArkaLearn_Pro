import { apiRequest, buildQuery } from './client';
import type { CourseQri, SearchCourseQri, PagedData, PagedResponseRaw } from './types';
import { normalizePagedResponse } from './types';
import type { CourseListItem } from '@/types';
import { normalizeCategoryPath } from '@/components/shared/course-category-breadcrumb';
import { buildCourseSlug } from '@/lib/course-slug';
import { toUserFacingMessage } from '@/lib/errors/user-facing-message';

const BASE = 'Course';

export type ProfessorCourseFormPayload = {
  title: string;
  shortDescription?: string;
  description: string;
  level: string;
  price: number;
  originalPrice?: number;
  /** cash | installment */
  paymentType?: 'cash' | 'installment';
  installmentPlans?: {
    installmentNumber: number;
    amountToman: number;
    dueDateUtc?: Date | string | null;
  }[];
  category: string;
  status: 'Published' | 'Draft';
  degreeRequired?: boolean;
  tags?: string[];
  prerequisites?: string;
  faqs?: { id: string; question: string; answer: string }[];
  sections?: {
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
      videoTitle?: string;
      videoUrl?: string;
      durationSeconds?: number;
      videoFile?: File;
      mediaAssetId?: number | string;
      removeVideo?: boolean;
      isPublished?: boolean;
    }[];
  }[];
  thumbnailUrl?: File | string;
  videoUrl?: File | string;
  introVideoDurationSeconds?: number;
  deliveryMode?: 'directDownload' | 'desktopLicense';
  lifecyclePhase?: 'notStarted' | 'inProgress' | 'ended';
  registrationClosed?: boolean;
  registrationDeadlineUtc?: string | Date;
  courseStartUtc?: string | Date;
  courseEndUtc?: string | Date;
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
};

function normalizeDeliveryMode(raw: unknown): 'directDownload' | 'desktopLicense' | undefined {
  if (raw == null || raw === '') return undefined;
  const mode = String(raw).toLowerCase();
  if (mode === 'desktoplicense' || mode === 'desktop' || mode === '2') return 'desktopLicense';
  if (mode === 'spotplayerlicense' || mode === 'spotplayer' || mode === '1') return 'desktopLicense';
  if (mode === 'directdownload' || mode === '0') return 'directDownload';
  return undefined;
}

function mapToListItem(row: SearchCourseQri): CourseListItem {
  const extended = row as SearchCourseQri & Record<string, unknown>;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug?.trim() || buildCourseSlug(row.title, row.id),
    price: row.price,
    originalPrice: row.originalPrice,
    createAt: row.createAt,
    coursePlan: row.coursePlan,
    courseLevel: row.courseLevel,
    shortDescription: row.shortDescription,
    titleImage: row.titleImage,
    categoryName: row.categoryName,
    categoryId: row.categoryId,
    categoryPath: normalizeCategoryPath(row.categoryPath, row.categoryName),
    status: row.status,
    moderationStatus: row.moderationStatus,
    moderationRejectionNote: row.moderationRejectionNote,
    videoUrl: row.videoUrl,
    studentCount: row.studentCount ?? 0,
    commentCount: row.commentCount ?? 0,
    likeCount: row.likeCount ?? 0,
    rating: row.rating ?? 0,
    teacherName: row.teacherName?.trim() || undefined,
    durationMinutes: row.durationMinutes && row.durationMinutes > 0 ? row.durationMinutes : undefined,
    deliveryMode: normalizeDeliveryMode(extended.deliveryMode ?? extended.DeliveryMode),
  };
}

export async function searchProfessorCourses(params?: {
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<PagedData<CourseListItem>> {
  const { inputValue = '', pageNumber = 1, pageSize = 6 } = params ?? {};
  const path = `${BASE}/SearchMyCourses${buildQuery({
    inputValue,
    pageNumber,
    pageSize,
    needTotalCount: true,
  })}`;
  const raw = await apiRequest<PagedResponseRaw<SearchCourseQri>>(path);
  const data = normalizePagedResponse(raw);
  return {
    ...data,
    queryResult: data.queryResult.map(mapToListItem),
  };
}

function appendCourseFormFields(formData: FormData, course: ProfessorCourseFormPayload, courseId?: string) {
  if (courseId) formData.append('CourseId', String(courseId));
  formData.append('Title', course.title);
  formData.append('Description', course.shortDescription ?? '');
  formData.append('LongDescription', course.description);
  formData.append('CourseLevel', (course.level || 'beginner').trim().toLowerCase());
  formData.append('CoursePrice', course.price.toString());
  if (course.originalPrice != null && course.originalPrice > 0) {
    formData.append('OriginalPrice', course.originalPrice.toString());
  }
  formData.append('CategoryId', course.category);
  formData.append('IsPublish', course.status === 'Published' ? 'true' : 'false');
  formData.append('IsCertificate', course.degreeRequired === true ? 'true' : 'false');
  formData.append('DeliveryMode', course.deliveryMode ?? 'directDownload');
  formData.append('LifecyclePhase', course.lifecyclePhase ?? 'notStarted');
  formData.append('IsRegistrationClosed', course.registrationClosed === true ? 'true' : 'false');
  if (course.registrationDeadlineUtc) {
    formData.append('RegistrationDeadlineUtc', new Date(course.registrationDeadlineUtc).toISOString());
  }
  if (course.courseStartUtc) {
    formData.append('CourseStartUtc', new Date(course.courseStartUtc).toISOString());
  }
  if (course.courseEndUtc) {
    formData.append('CourseEndUtc', new Date(course.courseEndUtc).toISOString());
  }
  if (course.thumbnailUrl instanceof File) formData.append('TitleImage', course.thumbnailUrl);
  else if (typeof course.thumbnailUrl === 'string' && course.thumbnailUrl.trim()) {
    formData.append('TitleImageUrl', course.thumbnailUrl.trim());
  }
  if (course.videoUrl instanceof File) formData.append('VideoInfo', course.videoUrl);
  else if (typeof course.videoUrl === 'string' && course.videoUrl.trim()) {
    const introUrl = course.videoUrl.trim();
    if (!introUrl.toLowerCase().startsWith('drm://')) {
      formData.append('VideoInfoUrl', introUrl);
    }
  }
  if (course.introVideoDurationSeconds != null && course.introVideoDurationSeconds > 0) {
    formData.append('IntroVideoDurationSeconds', String(course.introVideoDurationSeconds));
  }

  formData.append(
    'SessionsJson',
    JSON.stringify(
      (course.sections ?? []).map((section) => ({
        id: section.id,
        title: section.title,
        lessons: (section.lessons ?? []).map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          videoTitle: lesson.videoTitle ?? lesson.title,
          videoUrl: lesson.videoFile ? undefined : lesson.videoUrl,
          mediaAssetId:
            lesson.mediaAssetId != null && Number(lesson.mediaAssetId) > 0
              ? Number(lesson.mediaAssetId)
              : undefined,
          durationSeconds: lesson.durationSeconds ?? 0,
          removeVideo: lesson.removeVideo === true,
          isPublished: lesson.isPublished === true,
        })),
      }))
    )
  );
  formData.append('KeywordsJson', JSON.stringify(course.tags ?? []));
  formData.append('PaymentType', course.paymentType === 'installment' ? 'Installment' : 'Cash');
  if (course.paymentType === 'installment' && course.installmentPlans?.length) {
    formData.append(
      'InstallmentPlansJson',
      JSON.stringify(
        course.installmentPlans.map((p) => ({
          installmentNumber: p.installmentNumber,
          amountToman: Number(p.amountToman) || 0,
          dueDateUtc:
            p.installmentNumber === 1 || !p.dueDateUtc
              ? null
              : new Date(p.dueDateUtc).toISOString(),
        }))
      )
    );
  } else {
    formData.append('InstallmentPlansJson', '[]');
  }
  if (course.seoTitle) formData.append('SeoTitle', course.seoTitle);
  if (course.metaDescription) formData.append('MetaDescription', course.metaDescription);
  if (course.ogImageUrl) formData.append('OgImageUrl', course.ogImageUrl);

  for (const section of course.sections ?? []) {
    for (const lesson of section.lessons ?? []) {
      if (lesson.videoFile instanceof File) {
        formData.append(`lessonVideo_${lesson.id}`, lesson.videoFile);
        formData.append(`lessonVideoDuration_${lesson.id}`, String(lesson.durationSeconds ?? 0));
        if (lesson.videoTitle) formData.append(`lessonVideoTitle_${lesson.id}`, lesson.videoTitle);
      }
    }
  }

  const prerequisitesArray =
    course.prerequisites
      ?.split(/[\r\n;؛]+/)
      .map((x) => x.trim())
      .map((x) => (x.length > 100 ? x.slice(0, 100).trim() : x))
      .filter((x) => x.length > 0) ?? [];

  formData.append('DependenciesJson', JSON.stringify(prerequisitesArray));
  formData.append('QuestionJson', JSON.stringify(course.faqs ?? []));
}

export function buildProfessorCourseFormData(
  course: ProfessorCourseFormPayload,
  options?: { courseId?: string; userId?: string | number; teacherId?: string | number }
) {
  const formData = new FormData();
  if (options?.userId) formData.append('UserId', String(options.userId));
  if (options?.teacherId) formData.append('TeacherId', String(options.teacherId));
  appendCourseFormFields(formData, course, options?.courseId);
  return formData;
}

export async function addProfessorCourse(
  course: ProfessorCourseFormPayload,
  userId: string | number
): Promise<{ ok: boolean; message?: string }> {
  const formData = buildProfessorCourseFormData(course, { userId });
  try {
    await apiRequest<string>('Course/Add', { method: 'POST', body: formData });
    return { ok: true };
  } catch (e) {
    const message = toUserFacingMessage(
      e instanceof Error ? e.message : 'Failed to add course',
      'error',
      'ذخیره دوره انجام نشد.'
    );
    return { ok: false, message };
  }
}

export async function updateProfessorCourse(
  courseId: string | number,
  course: ProfessorCourseFormPayload,
  userId: string | number
): Promise<{ ok: boolean; message?: string }> {
  const formData = buildProfessorCourseFormData(course, { courseId: String(courseId), userId });
  try {
    await apiRequest<string>('Course/Update', { method: 'POST', body: formData });
    return { ok: true };
  } catch (e) {
    const message = toUserFacingMessage(
      e instanceof Error ? e.message : 'Failed to update course',
      'error',
      'به‌روزرسانی دوره انجام نشد.'
    );
    return { ok: false, message };
  }
}

export function courseQriToProfessorPayload(
  course: CourseQri,
  statusOverride?: 'Published' | 'Draft'
): ProfessorCourseFormPayload {
  return {
    title: course.title,
    shortDescription: course.shortDescription ?? '',
    description: course.description ?? '',
    level: (course.level ?? 'beginner').toLowerCase(),
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
    category: String(course.categoryId ?? ''),
    status: statusOverride ?? (course.isPublish ? 'Published' : 'Draft'),
    degreeRequired: course.isCertificate,
    tags: course.tags ?? course.courseTags ?? [],
    prerequisites: '',
    faqs: (course.faqs ?? []).map((faq, index) => ({
      id: `faq-${index}`,
      question: faq.question ?? '',
      answer: faq.answer ?? '',
    })),
    sections: (course.sections ?? []).map((section, sectionIndex) => ({
      id:
        section.sessionId != null &&
        String(section.sessionId).trim() &&
        Number(section.sessionId) > 0
          ? String(section.sessionId)
          : `sec-${sectionIndex}`,
      title: section.sessionTitle,
      lessons: (section.courseLessons ?? []).map((lesson) => ({
        id: String(lesson.lessonId ?? lesson.lessonTitle),
        title: lesson.lessonTitle,
        videoTitle: lesson.videoTitle,
        videoUrl: lesson.videoUrl,
        durationSeconds: lesson.durationSeconds,
        isPublished: lesson.isPublished === true,
      })),
    })),
    thumbnailUrl: course.thumbnailUrl,
    videoUrl: course.videoUrl,
    deliveryMode: course.deliveryMode ?? 'directDownload',
    lifecyclePhase: course.lifecyclePhase ?? 'notStarted',
    registrationDeadlineUtc: course.registrationDeadlineUtc,
    courseStartUtc: course.courseStartUtc,
    courseEndUtc: course.courseEndUtc,
    registrationClosed: course.isRegistrationClosed === true,
  };
}

export async function deleteProfessorCourse(courseId: string | number): Promise<void> {
  await apiRequest(`${BASE}/Delete${buildQuery({ courseId })}`, {
    method: 'DELETE',
  });
}

export async function toggleProfessorCoursePublish(
  courseId: string | number,
  userId: string | number,
  nextStatus: 'Published' | 'Draft',
  courseDetail: CourseQri
): Promise<{ ok: boolean; message?: string }> {
  const payload = courseQriToProfessorPayload(courseDetail, nextStatus);
  return updateProfessorCourse(courseId, payload, userId);
}
