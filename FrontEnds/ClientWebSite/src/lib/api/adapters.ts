import type { Course, Article, Seminar, Project, Instructor, Review, FaqItem } from '@/types';
import type {
  CourseQri,
  SearchCourseQri,
  GetAllPopularCourseQri,
  ArticleQri,
  SearchArticleQri,
  SeminarQri,
  SearchSeminarQri,
  ProjectQri,
  ProjectGalleryItemQri,
  CourseFaqQri,
  CourseSessionQri,
  CourseCommentQri,
} from './types';
import {
  getArticleImageUrl,
  getCourseImageUrl,
  getCourseVideoUrl,
  getSeminarImageUrl,
  getUserImageUrl,
  getProjectImageUrl,
  getProjectVideoUrl,
} from '@/lib/utils/image-url';
import { buildCourseSlug } from '@/lib/course-slug';
import { normalizeCategoryPath } from '@/components/shared/course-category-breadcrumb';
import {
  deriveSeminarLocalDateKey,
  deriveSeminarLocalTime24,
} from '@/lib/utils/seminar-datetime';
import { computeCourseDiscountPercent } from '@/lib/utils/course-price';

const defaultInstructor: Instructor = {
  name: '—',
  name_en: '—',
  title: '—',
  title_en: '—',
  avatarUrl: '',
  avatarHint: 'instructor',
  bio: '',
  bio_en: '',
  stats: { courses: 0, articles: 0, points: 0 },
  social: {},
};

function normalizeLifecycle(value?: string | null): 'notStarted' | 'inProgress' | 'ended' {
  if (value === 'inProgress' || value === 'ended') return value;
  return 'notStarted';
}

function mapLevel(level?: string | null): 'introductory' | 'intermediate' | 'advanced' {
  if (!level) return 'introductory';
  const l = level.toLowerCase();
  if (l.includes('adv') || l.includes('پیشرفته')) return 'advanced';
  if (l.includes('inter') || l.includes('میان')) return 'intermediate';
  return 'introductory';
}

function apiFaqToFaqItem(faq: CourseFaqQri, index: number): FaqItem {
  return {
    id: `faq-${index}`,
    question: faq.question ?? '',
    question_en: faq.question ?? '',
    answer: faq.answer ?? '',
    answer_en: faq.answer ?? '',
  };
}

function apiCommentToReview(c: CourseCommentQri): Review {
  return {
    id: String(c.id),
    author: c.authorName,
    avatarUrl: getUserImageUrl(c.authorAvatar),
    avatarHint: 'user',
    rating: 0,
    title: '',
    comment: c.content,
    date: c.createAt,
    likes: c.commentLike,
    replies: [],
  };
}

function normalizeStringArray(raw: string[] | { $values?: string[] } | null | undefined): string[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : raw.$values ?? [];
  return list.map((item) => String(item ?? '').trim()).filter(Boolean);
}

function normalizeGalleryArray(
  raw: ProjectGalleryItemQri[] | { $values?: ProjectGalleryItemQri[] } | null | undefined
): ProjectGalleryItemQri[] {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : raw.$values ?? [];
  return list.map((item, index) => {
    const row = item as ProjectGalleryItemQri & Record<string, unknown>;
    return {
      title: String(row.title ?? row.Title ?? ''),
      shortDescription: String(row.shortDescription ?? row.ShortDescription ?? ''),
      imageUrl: String(row.imageUrl ?? row.ImageUrl ?? ''),
      sortOrder: Number(row.sortOrder ?? row.SortOrder ?? index),
    };
  });
}

function formatCourseDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** CourseQri (جزئیات) → Course برای صفحه جزئیات */
export function courseQriToCourse(api: CourseQri): Course {
  const id = String(api.courseId);
  const sections: CourseSessionQri[] = api.sections ?? [];
  let totalDurationSeconds = 0;
  const curriculum = sections.map((sec, i) => ({
    id:
      sec.sessionId != null && String(sec.sessionId).trim() && Number(sec.sessionId) > 0
        ? String(sec.sessionId)
        : `module-${i}`,
    title: sec.sessionTitle,
    title_en: sec.sessionTitle,
    lessons: (sec.courseLessons ?? []).map((les) => {
      const durationSeconds = Number(les.durationSeconds ?? 0);
      totalDurationSeconds += durationSeconds;
      return {
        id: String(les.lessonId ?? `l-${i}-${les.lessonTitle}`),
        title: les.lessonTitle,
        title_en: les.lessonTitle,
        videoTitle: les.videoTitle ?? les.lessonTitle,
        duration: les.durationLabel ?? formatCourseDuration(durationSeconds),
        durationSeconds,
        hasVideo: Boolean(les.hasVideo ?? les.videoUrl),
        isPublished: Boolean(les.isPublished),
        isLocked: Boolean(les.isLocked),
        isPreview: false,
      };
    }),
  }));
  const instructor: Instructor = {
    ...defaultInstructor,
    teacherId: api.teacherId,
    userName: api.teacherUserName,
    name: api.teacherName,
    name_en: api.teacherName,
    title: api.educationTitle ?? '',
    title_en: api.educationTitle ?? '',
    avatarUrl: getUserImageUrl(api.teacherProfileImage),
    bio: api.teacherBio ?? '',
    bio_en: api.teacherBio ?? '',
    stats: {
      courses: api.teacherPublishedCourseCount ?? 0,
      articles: api.teacherPublishedArticleCount ?? 0,
      points: api.teacherPoints ?? 0,
    },
  };
  return {
    id,
    title: api.title,
    title_en: api.title,
    slug: api.slug?.trim() || buildCourseSlug(api.title, api.courseId),
    description: api.shortDescription ?? api.description ?? '',
    description_en: api.shortDescription ?? api.description ?? '',
    longDescription: api.description ?? '',
    longDescription_en: api.description ?? '',
    author: api.teacherName,
    videoUrl: api.videoUrl ? getCourseVideoUrl(api.videoUrl) : '',
    instructor,
    price: Number(api.price),
    originalPrice: api.originalPrice != null && api.originalPrice > 0 ? Number(api.originalPrice) : undefined,
    discountPercentage: computeCourseDiscountPercent(Number(api.price), api.originalPrice),
    paymentType: api.paymentType === 'installment' ? 'installment' : 'cash',
    checkoutPrice: (() => {
      if (api.checkoutPrice != null && !Number.isNaN(Number(api.checkoutPrice))) {
        return Number(api.checkoutPrice);
      }
      if (api.paymentType === 'installment' && api.installmentPlans?.length) {
        const first = [...api.installmentPlans].sort((a, b) => a.installmentNumber - b.installmentNumber)[0];
        if (first) return Number(first.amountToman);
      }
      return Number(api.price);
    })(),
    installmentPlans: api.installmentPlans ?? [],
    tags: api.tags ?? api.courseTags ?? [],
    category: api.category,
    categoryPath: normalizeCategoryPath(api.categoryPath, api.category),
    level: mapLevel(api.level),
    imageUrl: getCourseImageUrl(api.thumbnailUrl),
    imageHint: api.title,
    rating: api.courseRate || 0,
    reviews: (api.comments ?? []).length,
    enrollmentCount: Number(api.enrollmentCount ?? 0),
    reviewsData: (api.comments ?? []).map(apiCommentToReview),
    duration: formatCourseDuration(totalDurationSeconds),
    lessonsCount: sections.reduce((sum, s) => sum + (s.courseLessons?.length ?? 0), 0),
    lastUpdated: api.createdAt ?? '',
    language: 'فارسی',
    deliveryMode: api.deliveryMode === 'desktopLicense'
      ? 'desktopLicense'
      : api.deliveryMode === 'spotPlayerLicense'
        ? 'desktopLicense'
        : 'directDownload',
    lifecyclePhase: normalizeLifecycle(api.effectiveLifecyclePhase ?? api.lifecyclePhase),
    effectiveLifecyclePhase: normalizeLifecycle(api.effectiveLifecyclePhase ?? api.lifecyclePhase),
    registrationDeadlineUtc: api.registrationDeadlineUtc,
    courseStartUtc: api.courseStartUtc,
    courseEndUtc: api.courseEndUtc,
    canRegister: api.canRegister !== false,
    whatYouWillLearn: [],
    whatYouWillLearn_en: [],
    curriculum,
    faq: (api.faqs ?? []).map(apiFaqToFaqItem),
    seoTitle: api.seoTitle ?? null,
    metaDescription: api.metaDescription ?? null,
    ogImageUrl: api.ogImageUrl ?? null,
  };
}

/** SearchCourseQri / GetAllPopularCourseQri (لیست) → Course برای کارت/لیست */
export function searchCourseToCourse(api: SearchCourseQri | GetAllPopularCourseQri): Course {
  const id = 'id' in api ? String(api.id) : String((api as GetAllPopularCourseQri).courseId);
  const title = api.title;
  const numericId = 'id' in api ? api.id : (api as GetAllPopularCourseQri).courseId;
  const slug = api.slug?.trim() || buildCourseSlug(title, numericId);
  const imageUrl = 'titleImage' in api ? (api as SearchCourseQri).titleImage : (api as GetAllPopularCourseQri).logoImage;
  return {
    id,
    title,
    title_en: title,
    slug,
    description: (api as SearchCourseQri).shortDescription ?? (api as GetAllPopularCourseQri).shortDescription ?? '',
    description_en: (api as SearchCourseQri).shortDescription ?? (api as GetAllPopularCourseQri).shortDescription ?? '',
    longDescription: '',
    longDescription_en: '',
    author: '',
    videoUrl:'',
    instructor: defaultInstructor,
    price: Number((api as SearchCourseQri).price ?? (api as GetAllPopularCourseQri).coursePrice ?? 0),
    originalPrice: (() => {
      const raw =
        (api as SearchCourseQri).originalPrice ?? (api as GetAllPopularCourseQri).originalPrice;
      return raw != null && raw > 0 ? Number(raw) : undefined;
    })(),
    discountPercentage: computeCourseDiscountPercent(
      Number((api as SearchCourseQri).price ?? (api as GetAllPopularCourseQri).coursePrice ?? 0),
      (api as SearchCourseQri).originalPrice ?? (api as GetAllPopularCourseQri).originalPrice
    ),
    tags: [],
    category: (api as SearchCourseQri).categoryName ?? (api as GetAllPopularCourseQri).categoryName ?? '',
    categoryPath: normalizeCategoryPath(
      (api as SearchCourseQri).categoryPath ?? (api as GetAllPopularCourseQri).categoryPath,
      (api as SearchCourseQri).categoryName ?? (api as GetAllPopularCourseQri).categoryName
    ),
    level: mapLevel((api as SearchCourseQri).courseLevel ?? (api as GetAllPopularCourseQri).courseLevel),
    imageUrl: getCourseImageUrl(imageUrl ?? ''),
    imageHint: title,
    rating: 0,
    reviews: (api as SearchCourseQri).studentCount ?? 0,
    reviewsData: [],
    duration: '',
    lessonsCount: 0,
    lastUpdated: (api as SearchCourseQri).createAt ?? (api as GetAllPopularCourseQri).createAt ?? '',
    language: 'فارسی',
    whatYouWillLearn: [],
    whatYouWillLearn_en: [],
    curriculum: [],
    faq: [],
  };
}

/** ArticleQri → Article */
export function articleQriToArticle(api: ArticleQri): Article {
  return {
    id: String(api.id),
    title: api.title,
    title_en: api.title,
    slug: api.slug,
    author: api.authorName ?? '',
    publishDate: api.publishedAt ?? api.createdAt,
    summary: api.summary,
    categoryName: api.categoryName ?? null,
    categoryId: api.categoryId ?? null,
    imageUrl: getArticleImageUrl(api.thumbnailUrl),
    imageHint: api.title,
    content: api.content,
    tags: {
      $id:String(api.id),
      $values : normalizeStringArray(api.tags),
    },
    seoTitle: api.seoTitle ?? null,
    metaDescription: api.metaDescription ?? null,
    ogImageUrl: api.ogImageUrl ?? null,
  };
}

/** ProjectQri → Project برای صفحه جزئیات */
export function projectQriToProject(api: ProjectQri): Project {
  return {
    id: String(api.id),
    title: api.title,
    slug: api.slug,
    shortDescription: api.shortDescription,
    longDescription: api.longDescription,
    thumbnailUrl: getProjectImageUrl(api.thumbnailUrl),
    introVideoUrl: api.introVideoUrl ? getProjectVideoUrl(api.introVideoUrl) : undefined,
    gitHubUrl: api.gitHubUrl ?? undefined,
    projectUrl: api.projectUrl ?? undefined,
    technologies: normalizeStringArray(api.technologies),
    gallery: normalizeGalleryArray(api.gallery)
      .map((item) => ({
        title: item.title,
        shortDescription: item.shortDescription,
        imageUrl: getProjectImageUrl(item.imageUrl),
        sortOrder: item.sortOrder,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    isPublished: api.isPublished,
    publishedAt: api.publishedAt ?? null,
    authorUserId: api.authorUserId,
    authorName: api.authorName,
    createdAt: api.createdAt,
    tags: normalizeStringArray(api.tags),
  };
}

/** SearchArticleQri → Article برای کارت/لیست */
export function searchArticleToArticle(api: SearchArticleQri): Article {
  return {
    id: String(api.id),
    title: api.title,
    title_en: api.title,
    slug: api.slug,
    author: '',
    publishDate: api.publishedAt ?? api.createdAt,
    summary: api.summary,
    categoryName: api.categoryName ?? null,
    imageUrl: getArticleImageUrl(api.thumbnailUrl),
    imageHint: api.title,
    content: api.summary,
    tags: {
      $id:String(api.id),
      $values : [],
    }
  };
}

function buildSeminarImageUrl(thumbnailUrl?: string): string {
  return getSeminarImageUrl(thumbnailUrl);
}

/** SeminarQri → Seminar (هماهنگ با خروجی API جزئیات سمینار) */
export function seminarQriToSeminar(api: SeminarQri): Seminar {
  const raw = api as SeminarQri & Record<string, unknown>;
  const seminarId = Number(raw.id ?? raw.Id ?? 0);
  const dateStr = api.startTime ? deriveSeminarLocalDateKey(api.startTime) : '';
  const timeStr = api.startTime ? deriveSeminarLocalTime24(api.startTime) : '';
  const endTimeStr = api.endTime ? deriveSeminarLocalTime24(api.endTime) : '';
  let faq: FaqItem[] = [];
  if (api.faqsJson) {
    try {
      const parsed = JSON.parse(api.faqsJson) as Array<{ question?: string; answer?: string }>;
      faq = parsed.map((f, i) => ({
        id: `faq-${i}`,
        question: f.question ?? '',
        question_en: f.question ?? '',
        answer: f.answer ?? '',
        answer_en: f.answer ?? '',
      }));
    } catch {
      // ignore
    }
  }
  let tags: string[] = [];
  if (api.tagsJson) {
    try {
      const parsed = JSON.parse(api.tagsJson) as string[];
      tags = Array.isArray(parsed) ? parsed : [];
    } catch {
      // ignore
    }
  }

  const speakerName = api.instructorName?.trim() ?? '';
  const instructor: Instructor = speakerName
    ? {
        ...defaultInstructor,
        name: speakerName,
        name_en: speakerName,
        title: api.instructorTitle ?? 'مدرس سمینار',
        title_en: api.instructorTitle ?? 'Seminar Instructor',
        avatarUrl: getUserImageUrl(api.instructorAvatarUrl),
        avatarHint: speakerName,
        bio: api.instructorBio ?? '',
        bio_en: api.instructorBio ?? '',
      }
    : defaultInstructor;

  return {
    id: String(seminarId),
    title: String(raw.title ?? raw.Title ?? ''),
    slug: String(seminarId),
    speaker: speakerName,
    instructor,
    date: dateStr,
    time: timeStr,
    startDateTime: api.startTime,
    endDateTime: api.endTime,
    price: Number(api.price),
    imageUrl: buildSeminarImageUrl(api.thumbnailUrl),
    imageHint: api.title,
    description: api.description ?? '',
    category: api.roomTitle ?? '',
    level: 'intermediate',
    faq,
    tags: tags.length ? tags : undefined,
    roomLink: api.roomLink,
    roomTitle: api.roomTitle,
    entryLink: api.entryLink ?? undefined,
    capacity: api.capacity,
    registeredCount: api.registeredCount,
    isFree: api.isFree,
    prerequisites: api.prerequisites ?? undefined,
    endTime: endTimeStr || undefined,
    videoUrl: api.videoUrl ? getCourseVideoUrl(api.videoUrl) : undefined,
    isExpired: Boolean(api.isExpired),
    canRegister: Boolean(api.canRegister),
    hasRecording: Boolean(api.hasRecording),
    status: api.status,
    seoTitle: api.seoTitle ?? null,
    metaDescription: api.metaDescription ?? null,
    ogImageUrl: api.ogImageUrl ?? null,
  };
}

/** SearchSeminarQri → Seminar برای کارت/لیست */
export function searchSeminarToSeminar(api: SearchSeminarQri): Seminar {
  const raw = api as SearchSeminarQri & Record<string, unknown>;
  const seminarId = Number(raw.id ?? raw.Id ?? 0);
  const dateStr = api.startTime ? deriveSeminarLocalDateKey(api.startTime) : '';
  const timeStr = api.startTime ? deriveSeminarLocalTime24(api.startTime) : '';
  return {
    id: String(seminarId),
    title: String(raw.title ?? raw.Title ?? ''),
    slug: String(seminarId),
    speaker: '',
    instructor: defaultInstructor,
    date: dateStr,
    time: timeStr,
    startDateTime: api.startTime,
    endDateTime: api.endTime,
    price: Number(api.price),
    imageUrl: buildSeminarImageUrl(api.thumbnailUrl),
    imageHint: api.title,
    description: api.description ?? '',
    category: api.roomTitle ?? '',
    level: 'intermediate',
  };
}

