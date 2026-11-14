import type { Course, FAQ, Section } from '@/lib/types';
import { parseUtcApiDateTime } from '@/lib/utils/localized-dates';

export type CourseLevelCode = 'beginner' | 'intermediate' | 'advanced';
export type CourseLifecycleCode = 'notStarted' | 'inProgress' | 'ended';
export type CourseLanguageCode = 'fa' | 'en';
export type CourseDeliveryModeCode = 'directDownload' | 'desktopLicense';

export function normalizeCourseLevelCode(raw: Record<string, unknown>): CourseLevelCode {
  const rawLevel =
    raw.levelCode ??
    raw.LevelCode ??
    raw.courseLevel ??
    raw.CourseLevel ??
    raw.level ??
    raw.Level ??
    '';

  // Domain enum: BEGINNER=1, INTERMEDIATE=2, ADVANCED=3
  if (typeof rawLevel === 'number') {
    if (rawLevel === 2) return 'intermediate';
    if (rawLevel === 3) return 'advanced';
    return 'beginner';
  }

  const code = String(rawLevel).trim().toLowerCase();

  if (code === '2' || code === 'intermediate') return 'intermediate';
  if (code === '3' || code === 'advanced') return 'advanced';
  if (code === '1' || code === 'beginner') return 'beginner';

  if (code.includes('intermediate') || code.includes('میان')) return 'intermediate';
  if (code.includes('advanced') || code.includes('پیشرفته')) return 'advanced';
  if (code.includes('beginner') || code.includes('مبتدی') || code.length > 0) return 'beginner';

  return 'beginner';
}

export function normalizeCourseLanguageCode(raw: Record<string, unknown>): CourseLanguageCode {
  const value = String(
    raw.language ?? raw.Language ?? raw.courseLanguage ?? raw.CourseLanguage ?? ''
  )
    .trim()
    .toLowerCase();

  if (value === 'en' || value === 'english' || value.includes('انگلیسی')) return 'en';
  if (value === 'fa' || value === 'persian' || value === 'farsi' || value.includes('فارسی')) return 'fa';
  return 'fa';
}

export function normalizeCourseLifecyclePhase(raw: Record<string, unknown>): CourseLifecycleCode {
  const stored = String(raw.lifecyclePhase ?? raw.LifecyclePhase ?? '').trim();
  const effective = String(
    raw.effectiveLifecyclePhase ?? raw.EffectiveLifecyclePhase ?? ''
  ).trim();

  const value = stored || effective;
  if (value === 'inProgress' || value === 'InProgress') return 'inProgress';
  if (value === 'ended' || value === 'Ended') return 'ended';
  return 'notStarted';
}

export function normalizeCoursePublishStatus(raw: Record<string, unknown>): 'Published' | 'Draft' {
  // Search uses Status: "Published"|"Draft". GetById uses Status for Free/Paid
  // and exposes publish state via IsPublish — never treat Free/Paid as Draft blindly.
  const status = String(raw.status ?? raw.Status ?? '').trim().toLowerCase();
  if (status === 'published') return 'Published';
  if (status === 'draft') return 'Draft';

  if ('isPublish' in raw || 'IsPublish' in raw) {
    return Boolean(raw.isPublish ?? raw.IsPublish) ? 'Published' : 'Draft';
  }

  return 'Draft';
}

export function normalizeDeliveryMode(raw: Record<string, unknown>): CourseDeliveryModeCode {
  const rawValue = raw.deliveryMode ?? raw.DeliveryMode ?? 'directDownload';
  if (typeof rawValue === 'number') {
    if (rawValue === 1 || rawValue === 2) return 'desktopLicense';
    return 'directDownload';
  }

  const value = String(rawValue).trim();
  const lower = value.toLowerCase();
  if (
    value === 'spotPlayerLicense' ||
    lower === 'spotplayerlicense' ||
    lower === 'spotplayer' ||
    lower === '1'
  ) {
    return 'desktopLicense';
  }
  if (
    value === 'desktopLicense' ||
    lower === 'desktoplicense' ||
    lower === 'desktop' ||
    lower === '2'
  ) {
    return 'desktopLicense';
  }
  return 'directDownload';
}

function toArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[];
  if (val && typeof val === 'object' && '$values' in val && Array.isArray((val as { $values: unknown }).$values)) {
    return (val as { $values: T[] }).$values;
  }
  return [];
}

function mapApiSections(raw: Record<string, unknown>): Section[] {
  return toArray<Record<string, unknown>>(raw.sections ?? raw.Sections).map((s, secIdx) => {
    const lessons = toArray<Record<string, unknown>>(
      s.courseLessons ?? s.CourseLessons ?? s.lessons ?? s.Lessons,
    );
    return {
      id: String(s.sessionId ?? s.SessionId ?? s.id ?? s.Id ?? `sec-${secIdx}`),
      title: String(s.sessionTitle ?? s.SessionTitle ?? s.title ?? s.Title ?? ''),
      lessons: lessons.map((l, lesIdx) => ({
        id: String(l.lessonId ?? l.LessonId ?? l.id ?? l.Id ?? `les-${secIdx}-${lesIdx}`),
        title: String(l.lessonTitle ?? l.LessonTitle ?? l.title ?? l.Title ?? ''),
        videoTitle: String(l.videoTitle ?? l.VideoTitle ?? l.lessonTitle ?? l.LessonTitle ?? ''),
        videoUrl: (l.videoUrl ?? l.VideoUrl) as string | undefined,
        durationSeconds: Number(l.durationSeconds ?? l.DurationSeconds ?? 0),
        hasVideo: Boolean(l.hasVideo ?? l.HasVideo ?? l.mediaAssetId ?? l.MediaAssetId ?? l.videoUrl ?? l.VideoUrl),
        hasEncryptedVideo: Boolean(l.hasEncryptedVideo ?? l.HasEncryptedVideo ?? l.mediaAssetId ?? l.MediaAssetId),
        mediaAssetId: (l.mediaAssetId ?? l.MediaAssetId) as number | string | undefined,
        isPublished: Boolean(l.isPublished ?? l.IsPublished ?? false),
      })),
    };
  });
}

function mapApiFaqs(raw: Record<string, unknown>): FAQ[] {
  return toArray<Record<string, unknown>>(
    raw.faQs ?? raw.faqs ?? raw.FAQs ?? raw.courseFaqs ?? raw.CourseFaqs,
  ).map((f, index) => ({
    id: String(f.id ?? f.Id ?? `faq-${index}`),
    question: String(f.question ?? f.Question ?? ''),
    answer: String(f.answer ?? f.Answer ?? ''),
  }));
}

/** Coerce API date fields to ISO string for Course model. */
export function optionalApiDateString(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  return undefined;
}

export function unwrapCourseApiPayload(raw: unknown): Record<string, unknown> {
  let current: unknown = raw;
  for (let depth = 0; depth < 4; depth++) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) break;
    const obj = current as Record<string, unknown>;
    const nested = obj.data ?? obj.Data ?? obj.result ?? obj.Result ?? obj.queryResult ?? obj.QueryResult;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      current = nested;
      continue;
    }
    break;
  }
  return (current && typeof current === 'object' ? current : {}) as Record<string, unknown>;
}

export function mapApiCourseDetailToCourse(raw: unknown): Partial<Course> & { id: string } {
  const c = unwrapCourseApiPayload(raw);
  const id = c.courseId ?? c.CourseId ?? c.id ?? c.Id;
  const categoryId = c.categoryId ?? c.CategoryId;

  return {
    id: String(id ?? ''),
    title: String(c.title ?? c.Title ?? ''),
    shortDescription: String(c.shortDescription ?? c.ShortDescription ?? c.description ?? c.Description ?? ''),
    description: String(c.longDescription ?? c.LongDescription ?? c.description ?? c.Description ?? ''),
    price: Number(c.price ?? c.Price ?? 0),
    originalPrice: (() => {
      const raw = c.originalPrice ?? c.OriginalPrice;
      const num = raw != null ? Number(raw) : 0;
      return num > 0 ? num : undefined;
    })(),
    paymentType: (() => {
      const raw = String(c.paymentType ?? c.PaymentType ?? 'cash').toLowerCase();
      return raw === 'installment' ? 'installment' : 'cash';
    })(),
    installmentPlans: (() => {
      const rawPlans = c.installmentPlans ?? c.InstallmentPlans;
      const list = Array.isArray(rawPlans)
        ? rawPlans
        : rawPlans && typeof rawPlans === 'object' && Array.isArray((rawPlans as { $values?: unknown }).$values)
          ? ((rawPlans as { $values: unknown[] }).$values)
          : [];
      return list
        .map((row) => {
          const r = row as Record<string, unknown>;
          return {
            installmentNumber: Number(r.installmentNumber ?? r.InstallmentNumber ?? 0),
            amountToman: Number(r.amountToman ?? r.AmountToman ?? 0),
            dueDateUtc: (r.dueDateUtc ?? r.DueDateUtc ?? null) as string | null,
          };
        })
        .filter((p) => p.installmentNumber > 0)
        .sort((a, b) => a.installmentNumber - b.installmentNumber);
    })(),
    level: normalizeCourseLevelCode(c),
    language: normalizeCourseLanguageCode(c),
    lifecyclePhase: normalizeCourseLifecyclePhase(c),
    status: normalizeCoursePublishStatus(c),
    category:
      categoryId != null && categoryId !== 0
        ? String(categoryId)
        : String(c.category ?? c.Category ?? ''),
    isPublish: Boolean(c.isPublish ?? c.IsPublish),
    registrationClosed: Boolean(
      c.isRegistrationClosed ?? c.IsRegistrationClosed ?? false
    ),
    deliveryMode: normalizeDeliveryMode(c),
    registrationDeadlineUtc: optionalApiDateString(
      c.registrationDeadlineUtc ?? c.RegistrationDeadlineUtc,
    ),
    courseStartUtc: optionalApiDateString(c.courseStartUtc ?? c.CourseStartUtc),
    courseEndUtc: optionalApiDateString(c.courseEndUtc ?? c.CourseEndUtc),
  };
}

/** Normalized select values for course create/edit form (level, language, lifecycle). */
export function resolveCourseFormSelectValues(source: Record<string, unknown> | Partial<Course>) {
  const raw = source as Record<string, unknown>;
  return {
    level: normalizeCourseLevelCode(raw),
    language: normalizeCourseLanguageCode(raw),
    lifecyclePhase: normalizeCourseLifecyclePhase(raw),
  };
}

export type CourseFormDefaultValues = {
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  level: CourseLevelCode;
  language: CourseLanguageCode;
  price: number;
  originalPrice: number;
  isSpecial: boolean;
  specialDetails: string;
  tags: string[];
  prerequisites: string;
  faqs: FAQ[];
  sections: Section[];
  thumbnailUrl?: File | string;
  videoUrl?: File | string;
  degreeRequired: boolean;
  deliveryMode: CourseDeliveryModeCode;
  lifecyclePhase: CourseLifecycleCode;
  registrationDeadlineUtc?: Date;
  courseStartUtc?: Date;
  courseEndUtc?: Date;
  registrationClosed: boolean;
  status: 'Published' | 'Draft';
  paymentType: 'cash' | 'installment';
  installmentPlans: {
    installmentNumber: number;
    amountToman: number;
    dueDateUtc?: Date | null;
  }[];
};

export function createEmptyCourseFormDefaults(): CourseFormDefaultValues {
  return {
    title: '',
    shortDescription: '',
    description: '',
    category: '',
    level: 'beginner',
    language: 'fa',
    price: 0,
    originalPrice: 0,
    isSpecial: false,
    specialDetails: '',
    tags: [],
    prerequisites: '',
    faqs: [],
    sections: [],
    thumbnailUrl: undefined,
    videoUrl: undefined,
    degreeRequired: false,
    deliveryMode: 'directDownload',
    lifecyclePhase: 'notStarted',
    registrationDeadlineUtc: undefined,
    courseStartUtc: undefined,
    courseEndUtc: undefined,
    registrationClosed: false,
    status: 'Draft',
    paymentType: 'cash',
    installmentPlans: [],
  };
}

/** Map API or store Course into react-hook-form values for create/edit modal. */
export function mapCourseToFormDefaults(
  source: Partial<Course> | Record<string, unknown>,
): CourseFormDefaultValues {
  const raw = source as Record<string, unknown>;
  const selectValues = resolveCourseFormSelectValues(raw);
  const sections = Array.isArray(raw.sections) && raw.sections.length > 0
    ? (raw.sections as Section[])
    : mapApiSections(raw);
  const faqs = Array.isArray(raw.faqs) && raw.faqs.length > 0
    ? (raw.faqs as FAQ[])
    : mapApiFaqs(raw);
  const dependencies = toArray<string>(raw.dependencies ?? raw.Dependencies);
  const prerequisites = String(raw.prerequisites ?? '').trim()
    || (dependencies.length > 0 ? dependencies.join('\n') : '');

  return {
    title: String(raw.title ?? raw.Title ?? ''),
    shortDescription: String(
      raw.shortDescription ?? raw.ShortDescription ?? raw.shortDesc ?? '',
    ),
    description: String(
      raw.description ?? raw.Description ?? raw.longDescription ?? raw.LongDescription ?? '',
    ),
    category: (() => {
      const categoryId = raw.categoryId ?? raw.CategoryId;
      if (categoryId != null && categoryId !== 0 && categoryId !== '') {
        return String(categoryId);
      }
      return String(raw.category ?? raw.Category ?? '');
    })(),
    level: selectValues.level,
    language: selectValues.language,
    lifecyclePhase: selectValues.lifecyclePhase,
    price: Number(raw.price ?? raw.Price ?? 0),
    originalPrice: Number(raw.originalPrice ?? raw.OriginalPrice ?? 0),
    tags: toArray<string>(raw.tags ?? raw.Tags ?? raw.courseTags ?? raw.CourseTags),
    prerequisites,
    faqs,
    sections,
    thumbnailUrl: (raw.thumbnailUrl ?? raw.ThumbnailUrl) as File | string | undefined,
    videoUrl: (raw.videoUrl ?? raw.VideoUrl) as File | string | undefined,
    degreeRequired: Boolean(raw.degreeRequired ?? raw.isCertificate ?? raw.IsCertificate ?? false),
    status: normalizeCoursePublishStatus(raw),
    deliveryMode: normalizeDeliveryMode(raw),
    registrationClosed: Boolean(
      raw.registrationClosed ?? raw.isRegistrationClosed ?? raw.IsRegistrationClosed ?? false,
    ),
    registrationDeadlineUtc:
      selectValues.lifecyclePhase === 'ended'
        ? undefined
        : parseUtcApiDateTime(
            (raw.registrationDeadlineUtc ?? raw.RegistrationDeadlineUtc) as string | Date | undefined,
          ),
    courseStartUtc:
      selectValues.lifecyclePhase === 'ended'
        ? undefined
        : parseUtcApiDateTime(
            (raw.courseStartUtc ?? raw.CourseStartUtc) as string | Date | undefined,
          ),
    courseEndUtc:
      selectValues.lifecyclePhase === 'ended'
        ? undefined
        : parseUtcApiDateTime(
            (raw.courseEndUtc ?? raw.CourseEndUtc) as string | Date | undefined,
          ),
    isSpecial: Boolean(raw.isSpecial ?? false),
    specialDetails: String(raw.specialDetails ?? ''),
    paymentType: (() => {
      const type = String(raw.paymentType ?? raw.PaymentType ?? 'cash').toLowerCase();
      return type === 'installment' ? 'installment' : 'cash';
    })(),
    installmentPlans: (() => {
      const type = String(raw.paymentType ?? raw.PaymentType ?? 'cash').toLowerCase();
      if (type !== 'installment') return [];
      const rawPlans = raw.installmentPlans ?? raw.InstallmentPlans;
      const list = Array.isArray(rawPlans)
        ? rawPlans
        : rawPlans && typeof rawPlans === 'object' && Array.isArray((rawPlans as { $values?: unknown }).$values)
          ? ((rawPlans as { $values: unknown[] }).$values)
          : [];
      return list
        .map((row) => {
          const r = row as Record<string, unknown>;
          const due = r.dueDateUtc ?? r.DueDateUtc;
          return {
            installmentNumber: Number(r.installmentNumber ?? r.InstallmentNumber ?? 0),
            amountToman: Number(r.amountToman ?? r.AmountToman ?? 0),
            dueDateUtc: due ? parseUtcApiDateTime(due as string | Date) ?? null : null,
          };
        })
        .filter((p) => p.installmentNumber > 0)
        .sort((a, b) => a.installmentNumber - b.installmentNumber);
    })(),
  };
}
