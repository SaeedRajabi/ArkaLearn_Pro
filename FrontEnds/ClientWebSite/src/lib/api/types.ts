/**
 * تایپ‌های پاسخ API مطابق DTOهای بک‌اند
 * نام پراپرتی‌ها عیناً هم‌نام با خروجی/ورودی API بک‌اند
 */

/** خام پاسخ صفحه‌بندی از بک‌اند؛ queryResult می‌تواند آرایه یا آبجکت با $values باشد */
export interface PagedResponseRaw<T> {
  $id?: string;
  queryResult?: { $id?: string; $values?: T[] } | T[] | null;
  QueryResult?: { $id?: string; $values?: T[] } | T[] | null;
  pageNumber?: number;
  PageNumber?: number;
  pageSize?: number;
  PageSize?: number;
  totalCount?: number;
  TotalCount?: number;
}

/** خروجی نرمال‌شده بعد از استخراج queryResult.$values */
export interface PagedData<T> {
  queryResult: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export function normalizePagedResponse<T>(raw: PagedResponseRaw<T> | null | undefined): PagedData<T> {
  if (!raw) {
    return { queryResult: [], totalCount: 0, pageNumber: 1, pageSize: 10 };
  }
  const record = raw as PagedResponseRaw<T> & Record<string, unknown>;
  const qr = raw.queryResult ?? record.QueryResult;
  const list = Array.isArray(qr)
    ? qr
    : (qr && typeof qr === 'object' && '$values' in qr && Array.isArray((qr as { $values?: T[] }).$values))
      ? (qr as { $values: T[] }).$values
      : [];
  return {
    queryResult: list,
    totalCount: raw.totalCount ?? record.TotalCount ?? 0,
    pageNumber: raw.pageNumber ?? record.PageNumber ?? 1,
    pageSize: raw.pageSize ?? record.PageSize ?? 10,
  };
}

// --- Course ---
export interface CourseInstallmentPlanQri {
  installmentNumber: number;
  amountToman: number;
  dueDateUtc?: string | null;
}

export interface CourseQri {
  courseId: number;
  title: string;
  slug?: string;
  status?: string;
  price: number;
  originalPrice?: number;
  /** Amount due at checkout (first installment or full cash price). */
  checkoutPrice?: number;
  /** cash | installment */
  paymentType?: 'cash' | 'installment';
  installmentPlans?: CourseInstallmentPlanQri[];
  shortDescription?: string;
  description?: string;
  thumbnailUrl?: string;
  createdAt?: string;
  level?: string;
  levelCode?: string;
  language?: string;
  courseRate: number;
  category: string;
  categoryId?: number;
  categoryPath?: string[] | { $values?: string[] };
  courseTags?: string[];
  videoCount: number;
  isCertificate: boolean;
  isPublish: boolean;
  deliveryMode?: 'directDownload' | 'desktopLicense';
  lifecyclePhase?: 'notStarted' | 'inProgress' | 'ended';
  effectiveLifecyclePhase?: 'notStarted' | 'inProgress' | 'ended';
  registrationDeadlineUtc?: string;
  courseStartUtc?: string;
  courseEndUtc?: string;
  canRegister?: boolean;
  isRegistrationClosed?: boolean;
  videoUrl?: string;
  teacherName: string;
  teacherUserName: string;
  teacherId?: number;
  teacherBio?: string;
  educationTitle?: string | null;
  teacherProfileImage: string;
  teacherPublishedCourseCount?: number;
  teacherPublishedArticleCount?: number;
  teacherPoints?: number;
  teacherStudentCount?: number;
  teacherReviewCount?: number;
  enrollmentCount?: number;
  tags?: string[];
  sections?: CourseSessionQri[];
  comments?: CourseCommentQri[];
  faqs?: CourseFaqQri[];
}

/** خام پاسخ GetById دوره؛ آرایه‌ها ممکن است به صورت { $values: T[] } باشند */
export interface CourseQriRaw {
  courseId: number;
  title: string;
  slug?: string;
  status?: string;
  price: number;
  originalPrice?: number;
  checkoutPrice?: number;
  paymentType?: string;
  installmentPlans?: CourseInstallmentPlanQri[] | { $values?: CourseInstallmentPlanQri[] };
  shortDescription?: string;
  description?: string;
  thumbnailUrl?: string;
  createdAt?: string;
  level?: string;
  courseRate: number;
  category: string;
  categoryId?: number;
  categoryPath?: string[] | { $values?: string[] };
  courseTags?: string[] | { $values?: string[] };
  videoCount: number;
  isCertificate: boolean;
  isPublish: boolean;
  deliveryMode?: 'directDownload' | 'desktopLicense';
  lifecyclePhase?: 'notStarted' | 'inProgress' | 'ended';
  effectiveLifecyclePhase?: 'notStarted' | 'inProgress' | 'ended';
  registrationDeadlineUtc?: string;
  courseStartUtc?: string;
  courseEndUtc?: string;
  canRegister?: boolean;
  isRegistrationClosed?: boolean;
  videoUrl?: string;
  teacherName: string;
  teacherUserName: string;
  teacherId?: number;
  teacherBio?: string;
  educationTitle?: string | null;
  teacherProfileImage: string;
  teacherPublishedCourseCount?: number;
  teacherPublishedArticleCount?: number;
  teacherPoints?: number;
  teacherStudentCount?: number;
  teacherReviewCount?: number;
  enrollmentCount?: number;
  tags?: string[] | { $values?: string[] };
  sections?: CourseSessionQri[] | { $values?: CourseSessionQriRaw[] };
  comments?: CourseCommentQri[] | { $values?: CourseCommentQri[] };
  faqs?: CourseFaqQri[] | { $values?: CourseFaqQri[] };
  faQs?: CourseFaqQri[] | { $values?: CourseFaqQri[] };
}

export interface CourseSessionQriRaw {
  sessionId?: number | string;
  SessionId?: number | string;
  sessionTitle: string;
  courseLessons?: CourseLessonQri[] | { $values?: CourseLessonQri[] };
}

export interface CourseSessionQri {
  sessionId?: number | string;
  sessionTitle: string;
  courseLessons?: CourseLessonQri[];
}

export interface CourseLessonQri {
  lessonId?: number;
  lessonTitle: string;
  videoTitle?: string;
  videoUrl?: string;
  durationSeconds?: number;
  durationLabel?: string;
  hasVideo?: boolean;
  isPublished?: boolean;
  isLocked?: boolean;
}

/** استخراج آرایه از مقدار که می‌تواند آرایه یا { $values: T[] } باشد */
function extractValues<T>(v: T[] | { $values?: T[] } | null | undefined): T[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'object' && v !== null && '$values' in v && Array.isArray((v as { $values?: T[] }).$values))
    return (v as { $values: T[] }).$values;
  return [];
}

/** نرمال‌سازی پاسخ خام جزئیات دوره به CourseQri */
export function normalizeCourseDetailResponse(raw: CourseQriRaw | null | undefined): CourseQri | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as CourseQriRaw & Record<string, unknown>;
  const courseId = Number(record.courseId ?? record.CourseId ?? 0);
  if (!courseId) return null;
  const sectionsRaw = extractValues<CourseSessionQriRaw>(
    (record.sections ?? record.Sections) as
      | CourseSessionQriRaw[]
      | { $values?: CourseSessionQriRaw[] }
      | undefined
  );
  const sections: CourseSessionQri[] = sectionsRaw.map((sec) => {
    const lessons = extractValues<CourseLessonQri>(
      (sec as CourseSessionQriRaw & { CourseLessons?: unknown }).courseLessons ??
        ((sec as CourseSessionQriRaw & { CourseLessons?: unknown }).CourseLessons as
          | CourseLessonQri[]
          | { $values?: CourseLessonQri[] }
          | undefined)
    );
    return {
      sessionId:
        (sec as CourseSessionQriRaw).sessionId ??
        (sec as CourseSessionQriRaw).SessionId,
      sessionTitle: String(
        (sec as CourseSessionQriRaw).sessionTitle ??
          (sec as { SessionTitle?: string }).SessionTitle ??
          ''
      ),
      courseLessons: lessons,
    };
  });
  return {
    courseId,
    title: String(record.title ?? record.Title ?? ''),
    slug: String(record.slug ?? record.Slug ?? '').trim() || undefined,
    status: (record.status ?? record.Status) as string | undefined,
    price: Number(record.price ?? record.Price ?? 0),
    originalPrice: (() => {
      const v = record.originalPrice ?? record.OriginalPrice;
      return v != null && Number(v) > 0 ? Number(v) : undefined;
    })(),
    checkoutPrice: (() => {
      const v = record.checkoutPrice ?? record.CheckoutPrice;
      return v != null && !Number.isNaN(Number(v)) ? Number(v) : undefined;
    })(),
    paymentType: (() => {
      const raw = String(record.paymentType ?? record.PaymentType ?? 'cash').toLowerCase();
      return raw === 'installment' ? 'installment' : 'cash';
    })(),
    installmentPlans: extractValues(record.installmentPlans ?? record.InstallmentPlans)
      .map((row) => {
        const r = row as Record<string, unknown>;
        return {
          installmentNumber: Number(r.installmentNumber ?? r.InstallmentNumber ?? 0),
          amountToman: Number(r.amountToman ?? r.AmountToman ?? 0),
          dueDateUtc: (r.dueDateUtc ?? r.DueDateUtc ?? null) as string | null,
        };
      })
      .filter((p) => p.installmentNumber > 0)
      .sort((a, b) => a.installmentNumber - b.installmentNumber),
    shortDescription: String(record.shortDescription ?? record.ShortDescription ?? '') || undefined,
    description: String(record.description ?? record.Description ?? '') || undefined,
    thumbnailUrl: String(record.thumbnailUrl ?? record.ThumbnailUrl ?? '') || undefined,
    createdAt: String(record.createdAt ?? record.CreatedAt ?? '') || undefined,
    level: String(record.levelCode ?? record.LevelCode ?? record.level ?? record.Level ?? '') || undefined,
    language: String(record.language ?? record.Language ?? 'fa') || 'fa',
    courseRate: Number(record.courseRate ?? record.CourseRate ?? 0),
    category: String(record.category ?? record.Category ?? ''),
    categoryId: Number(record.categoryId ?? record.CategoryId ?? 0) || undefined,
    categoryPath: extractValues(record.categoryPath ?? record.CategoryPath),
    courseTags: extractValues(record.courseTags ?? record.CourseTags),
    videoCount: Number(record.videoCount ?? record.VideoCount ?? 0),
    isCertificate: Boolean(record.isCertificate ?? record.IsCertificate ?? false),
    isPublish: Boolean(record.isPublish ?? record.IsPublish ?? false),
    deliveryMode: (() => {
      const mode = String(record.deliveryMode ?? record.DeliveryMode ?? 'directDownload').toLowerCase();
      if (mode === 'desktoplicense' || mode === 'desktop' || mode === '2') return 'desktopLicense';
      if (mode === 'spotplayerlicense' || mode === 'spotplayer' || mode === '1') return 'desktopLicense';
      return 'directDownload';
    })(),
    lifecyclePhase: String(record.lifecyclePhase ?? record.LifecyclePhase ?? 'notStarted') === 'inProgress'
      ? 'inProgress'
      : String(record.lifecyclePhase ?? record.LifecyclePhase ?? 'notStarted') === 'ended'
        ? 'ended'
        : 'notStarted',
    effectiveLifecyclePhase: String(
      record.effectiveLifecyclePhase ??
        record.EffectiveLifecyclePhase ??
        record.lifecyclePhase ??
        record.LifecyclePhase ??
        'notStarted'
    ) === 'inProgress'
      ? 'inProgress'
      : String(
            record.effectiveLifecyclePhase ??
              record.EffectiveLifecyclePhase ??
              record.lifecyclePhase ??
              record.LifecyclePhase ??
              'notStarted'
          ) === 'ended'
        ? 'ended'
        : 'notStarted',
    registrationDeadlineUtc: (record.registrationDeadlineUtc ?? record.RegistrationDeadlineUtc) as
      | string
      | undefined,
    courseStartUtc: (record.courseStartUtc ?? record.CourseStartUtc) as string | undefined,
    courseEndUtc: (record.courseEndUtc ?? record.CourseEndUtc) as string | undefined,
    canRegister: record.canRegister !== false && record.CanRegister !== false,
    isRegistrationClosed: Boolean(
      record.isRegistrationClosed ?? record.IsRegistrationClosed ?? false
    ),
    videoUrl: String(record.videoUrl ?? record.VideoUrl ?? '') || undefined,
    teacherName: String(record.teacherName ?? record.TeacherName ?? ''),
    teacherUserName: String(record.teacherUserName ?? record.TeacherUserName ?? ''),
    teacherId: Number(record.teacherId ?? record.TeacherId ?? 0) || undefined,
    teacherBio: String(record.teacherBio ?? record.TeacherBio ?? '') || undefined,
    educationTitle: (record.educationTitle ?? record.EducationTitle ?? undefined) as string | undefined,
    teacherProfileImage: String(record.teacherProfileImage ?? record.TeacherProfileImage ?? ''),
    teacherPublishedCourseCount: Number(
      record.teacherPublishedCourseCount ?? record.TeacherPublishedCourseCount ?? 0
    ),
    teacherPublishedArticleCount: Number(
      record.teacherPublishedArticleCount ?? record.TeacherPublishedArticleCount ?? 0
    ),
    teacherPoints: Number(record.teacherPoints ?? record.TeacherPoints ?? 0),
    teacherStudentCount: Number(record.teacherStudentCount ?? record.TeacherStudentCount ?? 0),
    teacherReviewCount: Number(record.teacherReviewCount ?? record.TeacherReviewCount ?? 0),
    enrollmentCount: Number(record.enrollmentCount ?? record.EnrollmentCount ?? 0),
    tags: extractValues(record.tags ?? record.Tags ?? record.courseTags ?? record.CourseTags),
    sections,
    comments: extractValues(record.comments ?? record.Comments),
    faqs: extractValues(record.faqs ?? record.Faqs ?? record.faQs ?? record.FaQs),
    faQs: extractValues(record.faQs ?? record.FaQs ?? record.faqs ?? record.Faqs),
    moderationStatus: String(record.moderationStatus ?? record.ModerationStatus ?? '') || undefined,
    moderationRejectionNote:
      String(record.moderationRejectionNote ?? record.ModerationRejectionNote ?? '') || undefined,
  } as CourseQri;
}

export interface CourseCommentQri {
  id: number;
  authorName: string;
  authorAvatar: string;
  commentLike: number;
  content: string;
  createAt: string;
}

export interface CourseFaqQri {
  question?: string;
  answer?: string;
}

export interface SearchCourseQri {
  id: number;
  title: string;
  slug?: string;
  price?: number;
  originalPrice?: number;
  createAt?: string;
  coursePlan?: string;
  courseLevel?: string;
  shortDescription?: string;
  titleImage?: string;
  categoryName: string;
  categoryId?: number;
  categoryPath?: string[] | { $values?: string[] };
  status: string;
  moderationStatus?: string;
  moderationRejectionNote?: string;
  videoUrl?: string;
  studentCount: number;
  commentCount?: number;
  likeCount?: number;
  rating?: number;
  teacherName?: string;
  durationMinutes?: number;
  deliveryMode?: 'directDownload' | 'desktopLicense';
}

export interface GetAllPopularCourseQri {
  courseId: number;
  title: string;
  slug?: string;
  coursePrice?: number;
  originalPrice?: number;
  createAt?: string;
  coursePlan?: string;
  courseLevel?: string;
  shortDescription?: string;
  logoImage?: string;
  categoryName: string;
  categoryId?: number;
  categoryPath?: string[];
}

export interface FavoriteCourseQri {
  id: number;
  title: string;
  price?: number;
  createAt?: string;
  courseLevel?: string;
  shortDescription?: string;
  titleImage?: string;
  categoryName: string;
  status: string;
  videoUrl?: string;
  studentCount: number;
}

// --- Article ---
export interface ArticleQri {
  id: number;
  title: string;
  summary: string;
  content: string;
  slug: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  publishedAt?: string;
  categoryId?: number;
  categoryName?: string;
  authorUserId: number;
  authorAvatarImage: string;
  authorName?: string;
  createdAt: string;
  tags: string[] | { $values?: string[] };
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
}

export interface ArticleCommentQri {
  id: number;
  articleId: number;
  articleTitle?: string | null;
  rating: number;
  text: string;
  likes: number;
  isApproved: boolean;
  timeStamp: string;
  parentId?: number | null;
  author?: {
    id: number;
    fullName: string;
    userName: string;
    avatarUrl: string;
  } | null;
  replies?: ArticleCommentQri[] | { $values?: ArticleCommentQri[] };
}

export interface ArticleReactionSummary {
  likes: number;
  dislikes: number;
  myReaction: -1 | 0 | 1;
}

export interface SearchArticleQri {
  id: number;
  title: string;
  summary: string;
  slug: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  publishedAt?: string;
  categoryId?: number;
  categoryName?: string;
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
  averageRating?: number;
  authorName?: string;
  tags?: string[];
}

// --- Seminar ---
export interface SeminarQri {
  id: number;
  title: string;
  description: string;
  startTime: string; // ISO date from API
  endTime: string;
  capacity: number;
  registeredCount: number;
  price: number;
  originalPrice?: number;
  isFree: boolean;
  status: number;
  entryLink?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  recordingVideoUrl?: string;
  isPublic?: boolean;
  isExpired?: boolean;
  canRegister?: boolean;
  hasRecording?: boolean;
  tagsJson?: string;
  prerequisites?: string;
  faqsJson?: string;
  roomId?: number;
  roomTitle?: string;
  roomLink?: string;
  /** نام مدرس/سخنران */
  instructorName?: string;
  /** تصویر پروفایل مدرس */
  instructorAvatarUrl?: string;
  /** عنوان/سمت مدرس */
  instructorTitle?: string;
  /** بیوگرافی مدرس */
  instructorBio?: string;
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
}

export interface SearchSeminarQri {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  registeredCount: number;
  price: number;
  originalPrice?: number;
  isFree: boolean;
  status: number;
  isPublic?: boolean;
  thumbnailUrl?: string;
  roomId?: number;
  roomTitle?: string;
}

export interface FavoriteSeminarQri {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  registeredCount: number;
  price: number;
  originalPrice?: number;
  isFree: boolean;
  status: number;
  thumbnailUrl?: string;
  roomId?: number;
  roomTitle?: string;
}

export interface FavoriteArticleQri {
  id: number;
  title: string;
  summary: string;
  slug: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  publishedAt?: string;
  categoryName?: string;
  createdAt: string;
}

// --- Project ---
export interface ProjectGalleryItemQri {
  title: string;
  shortDescription: string;
  imageUrl: string;
  sortOrder: number;
}

export interface ProjectQri {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  thumbnailUrl?: string;
  introVideoUrl?: string;
  gitHubUrl?: string;
  projectUrl?: string;
  technologies: string[] | { $values?: string[] };
  gallery: ProjectGalleryItemQri[] | { $values?: ProjectGalleryItemQri[] };
  isPublished: boolean;
  publishedAt?: string | null;
  authorUserId: number;
  authorName?: string;
  createdAt: string;
  tags: string[] | { $values?: string[] };
}

export interface SearchProjectQri {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  tags: string[] | { $values?: string[] };
  technologies: string[] | { $values?: string[] };
}

export interface AboutUsQri {
  id: number;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  introTitle: string;
  introContentHtml: string;
  missionTitle: string;
  missionContentHtml: string;
  visionTitle: string;
  visionContentHtml: string;
  valuesTitle: string;
  valuesContentHtml: string;
  teamTitle: string;
  teamContentHtml: string;
  teamImageUrl: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;
  ctaButtonUrl: string;
  teamMembers: AboutUsTeamMemberQri[];
  lastModifiedAt?: string;
}

export interface AboutUsTeamMemberQri {
  id: number;
  fullName: string;
  skillTitle: string;
  imageUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  websiteUrl: string;
  displayOrder: number;
}

export interface ContactUsQri {
  id: number;
  pageTitle: string;
  pageSubtitle: string;
  heroTitle: string;
  heroSubtitle: string;
  headquartersTitle: string;
  headquartersAddress: string;
  headquartersPhone: string;
  headquartersEmail: string;
  contactInfoTitle: string;
  contactInfoPhone: string;
  contactInfoEmail: string;
  salesSupportTitle: string;
  salesSupportPhone: string;
  salesSupportEmail: string;
  formTitle: string;
  formDescription: string;
  mapEmbedUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedInUrl: string;
  lastModifiedAt?: string;
}
