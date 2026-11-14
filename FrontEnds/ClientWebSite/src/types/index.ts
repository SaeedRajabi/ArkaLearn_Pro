/**
 * تعاریف TypeScript سراسر پروژه
 * پراپرتی‌های مربوط به API عیناً هم‌نام با بک‌اند هستند.
 */

import {BasketItem} from "@/lib/utils/basket-storage";

/** آیتم لیست دوره (هم‌نام با خروجی جستجوی دوره در API) */
export type CourseListItem = {
  id: number;
  title: string;
  slug?: string;
  price?: number;
  originalPrice?: number;
  createAt?: string;
  coursePlan?: string | null;
  courseLevel?: string;
  shortDescription?: string;
  titleImage?: string;
  categoryName: string;
  categoryId?: number;
  categoryPath?: string[];
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
};

/** آیتم لیست مقاله (هم‌نام با خروجی جستجوی مقاله در API) */
export type ArticleListItem = {
  id: number;
  title: string;
  summary: string;
  slug: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  publishedAt?: string | null;
  categoryName?: string;
  categoryId?: number;
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
  averageRating?: number;
  authorName?: string;
  tags?: string[];
};

/** آیتم لیست پروژه (هم‌نام با خروجی جستجوی پروژه در API) */
export type ProjectListItem = {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  tags: string[];
  technologies: string[];
};

export type ProjectGalleryItem = {
  title: string;
  shortDescription: string;
  imageUrl: string;
  sortOrder: number;
};

export type Project = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  thumbnailUrl: string;
  introVideoUrl?: string;
  gitHubUrl?: string;
  projectUrl?: string;
  technologies: string[];
  gallery: ProjectGalleryItem[];
  isPublished: boolean;
  publishedAt?: string | null;
  authorUserId: number;
  authorName?: string;
  createdAt: string;
  tags: string[];
};

/** آیتم لیست سمینار (هم‌نام با خروجی جستجوی سمینار در API) */
export type SeminarListItem = {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  registeredCount: number;
  price: number;
  isFree: boolean;
  status: number;
  isPublic?: boolean;
  thumbnailUrl?: string;
  roomId?: number;
  roomTitle?: string;
};

export type Instructor = {
  teacherId?: number;
  userName?: string;
  name: string;
  name_en: string;
  title: string;
  title_en: string;
  avatarUrl: string;
  avatarHint: string;
  bio: string;
  bio_en: string;
  stats: {
    courses: number;
    articles: number;
    points: number;
  };
  social: {
    youtube?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
};

export type TeacherEducation = {
  id: number;
  universityName: string;
  degreeType: string;
  degreeImage: string;
};

export type TeacherSkill = {
  id: number;
  name: string;
  rate: number;
};

export type TeacherCourseSummary = {
  courseId: number;
  title: string;
  thumbnailUrl?: string;
  price: number;
  level: string;
};

export type TeacherResume = {
  id: number;
  title: string;
  description: string;
  pdfFileUrl: string;
  pdfFileName?: string;
  approvalStatus: string;
};

export type TeacherProfile = {
  teacherId: number;
  userId: number;
  displayName: string;
  userName: string;
  avatarUrl: string;
  headline: string;
  longDescription: string;
  shortDescription?: string;
  headerImageUrl?: string;
  teachingCategoryId?: number;
  teachingCategoryName?: string;
  profileApprovalStatus?: string;
  profileRejectionNote?: string | null;
  accountStatus?: string;
  accountStatusNote?: string | null;
  publishedCourseCount: number;
  publishedArticleCount: number;
  points: number;
  studentCount: number;
  reviewCount: number;
  followerCount?: number;
  isFollowing?: boolean;
  educations: TeacherEducation[];
  skills: TeacherSkill[];
  courses: TeacherCourseSummary[];
  resume?: TeacherResume;
};

export type Review = {
  id: string;
  author: string;
  email?: string;
  avatarUrl: string;
  avatarHint: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  likes?: number;
  dislikes?: number;
  replies?: Review[];
};

export type FaqItem = {
  id: string;
  question: string;
  question_en: string;
  answer: string;
  answer_en: string;
};

export type Course = {
  id: string;
  title: string;
  title_en: string;
  slug: string;
  description: string;
  description_en: string;
  longDescription: string;
  longDescription_en: string;
  videoUrl: string;
  author: string;
  instructor: Instructor;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  deadline?: string;
  /** cash | installment */
  paymentType?: 'cash' | 'installment';
  /** Amount due at checkout (first installment or full cash price). */
  checkoutPrice?: number;
  installmentPlans?: {
    installmentNumber: number;
    amountToman: number;
    dueDateUtc?: string | null;
  }[];
  tags: string[];
  category: string;
  categoryPath?: string[];
  level: 'introductory' | 'intermediate' | 'advanced';
  imageUrl: string;
  imageHint: string;
  rating: number;
  reviews: number;
  enrollmentCount?: number;
  reviewsData: Review[];
  bestseller?: boolean;
  duration: string;
  lessonsCount: number;
  lastUpdated: string;
  language: string;
  deliveryMode?: 'directDownload' | 'desktopLicense';
  lifecyclePhase?: 'notStarted' | 'inProgress' | 'ended';
  effectiveLifecyclePhase?: 'notStarted' | 'inProgress' | 'ended';
  registrationDeadlineUtc?: string;
  courseStartUtc?: string;
  courseEndUtc?: string;
  canRegister?: boolean;
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  whatYouWillLearn: string[];
  whatYouWillLearn_en: string[];
  curriculum: {
    id: string;
    title: string;
    title_en: string;
    lessons: {
      id: string;
      title: string;
      title_en: string;
      videoTitle?: string;
      duration: string;
      durationSeconds?: number;
      hasVideo?: boolean;
      isPublished?: boolean;
      isLocked?: boolean;
      isPreview: boolean;
    }[];
  }[];
  faq: FaqItem[];
};

export type Article = {
  id: string;
  title: string;
  title_en: string;
  slug: string;
  author: string;
  publishDate: string;
  summary?: string;
  categoryName?: string | null;
  categoryId?: number | null;
  imageUrl: string;
  imageHint: string;
  content: string;
  tags: string[] | {
    $id:string;
    $values:string[]
  };
  likes?: number;
  dislikes?: number;
  reviewsData?: Review[];
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
};

export type Seminar = {
  id: string;
  title: string;
  slug: string;
  speaker: string;
  instructor: Instructor;
  date: string;
  time: string;
  startDateTime?: string;
  price: number;
  imageUrl: string;
  imageHint: string;
  description: string;
  category: string;
  level: 'introductory' | 'intermediate' | 'advanced';
  faq?: FaqItem[];
  /** از API: تگ‌ها (از tagsJson) */
  tags?: string[];
  /** از API: لینک اتاق/کلاس آنلاین */
  roomLink?: string;
  /** از API: عنوان اتاق */
  roomTitle?: string;
  /** از API: لینک ورود به سمینار */
  entryLink?: string;
  capacity?: number;
  registeredCount?: number;
  isFree?: boolean;
  /** از API: پیش‌نیازها */
  prerequisites?: string;
  /** زمان پایان برای نمایش */
  endTime?: string;
  endDateTime?: string;
  /** لینک ویدیو */
  videoUrl?: string;
  isExpired?: boolean;
  canRegister?: boolean;
  hasRecording?: boolean;
  status?: number;
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
};

export type Dictionary = {
  [key: string]: any;
};

export type Skill = {
  id: string;
  name: string;
  rate: number;
};

export interface MyCourseAPI{
  $id:string;
  $values:MyCourse[];
}

export interface MyCourse {
  id: number;
  title: string;
  imageUrl: string;
  desktopLicenseKey?: string;
  onlineClassUrl?: string;
  progress: number;
  status: string;
  enrollmentDateTime?: string;
  isFree?: boolean;
  price?: number;
  originalPrice?: number;
  deliveryMode?: 'directDownload' | 'desktopLicense';
  lifecyclePhase?: 'notStarted' | 'inProgress' | 'ended';
  effectiveLifecyclePhase?: 'notStarted' | 'inProgress' | 'ended';
  isActive?: boolean;
  isPendingApproval?: boolean;
  isLicenseRequestPending?: boolean;
}

export interface MySeminarAPI{
  $id:string;
  $values:MySeminar[]
}

export interface MySeminar {
  seminarId: number;
  seminarTitle: string;
  startTime: string;
  endTime: string;
  roomLink?: string;
  roomUserName?: string;
  registeredAt: string;
  hasPaid: boolean;
}

export interface MyOrder {
  id: number;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: string[];
}

export interface BasketItemsInRequest{

}


export interface CreateOrderFromBasketRequest{
  items: {
    courseId: number;
    quantity: number;
    courseName: string | null;
    courseImage: string | undefined;
    price: number;
  }[];
  description:string | null;
  discountCode:string | null;
}