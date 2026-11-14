import {StaticImport} from "next/dist/shared/lib/get-img-props";

export type Role = 'Super Admin' | 'Admin' | 'User';

export interface ApiUser {
  token: string;
  id: string;
  name: string;
  userName: string;
  email: {
    value: string;
  };
  avatarUrl: string;
  role: number; // 1 student, 2 teacher, 3 admin
  status: number; // 1 active
  lastLogin: string;
}

export type Lesson = {
  id: string;
  title: string;
  videoTitle?: string;
  videoUrl?: string;
  durationSeconds?: number;
  hasVideo?: boolean;
  hasEncryptedVideo?: boolean;
  mediaAssetId?: number | string;
  videoFile?: File;
  removeVideo?: boolean;
  isPublished?: boolean;
};

export type Section = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type FAQ = {
  id: string;
  question: string;
  answer: string;
};

export type CourseComment = {
  id: string;
  content: string;
  createAt: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  shortDescription:string;
  category: string;
  price: number;
  originalPrice?: number;
  paymentType?: 'cash' | 'installment';
  installmentPlans?: {
    installmentNumber: number;
    amountToman: number;
    dueDateUtc?: string | Date | null;
  }[];
  level: string;
  language: string;
  status: 'Published' | 'Draft';
  studentCount: number;
  createdAt: Date;
  instructorId: string;
  thumbnailUrl?: string | StaticImport;
  videoUrl?: string | undefined;
  isSpecial?: boolean;
  isPublish?:boolean,
  specialDetails?: string;
  tags?: string[];
  prerequisites?: string;
  faqs?: FAQ[];
  sections?: Section[];
  comments?: CourseComment[];
  degreeRequired: boolean;
  deliveryMode?: 'directDownload' | 'desktopLicense';
  lifecyclePhase?: 'notStarted' | 'inProgress' | 'ended';
  registrationClosed?: boolean;
  registrationDeadlineUtc?: string;
  courseStartUtc?: string;
  courseEndUtc?: string;
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
};

export type Article = {
  id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  status: 'Published' | 'Draft';
  publishedAt: Date;
  views: number;
  imageUrl?: string;
  tags?: string[];
  /** برای ارسال به API */
  categoryId?: number | null;
  slug?: string;
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
  status: 'Published' | 'Draft';
  publishedAt: Date;
  thumbnailUrl?: string;
  introVideoUrl?: string;
  gitHubUrl?: string;
  projectUrl?: string;
  technologies?: string[];
  tags?: string[];
  gallery?: ProjectGalleryItem[];
  authorName?: string;
};

export type Seminar = {
  id: string;
  title: string;
  date: Date;
  location: string;
  attendees: number;
  status: 'Draft' | 'Published' | 'Ongoing' | 'Upcoming' | 'Completed' | 'Cancelled';
  statusNumeric?: number;
  isPublic?: boolean;
  isExpired?: boolean;
  canRegister?: boolean;
  hasRecording?: boolean;
  recordingVideoUrl?: string | null;
  description?: string;
  category: string;
  level: string;
  participants?: User[];
  /** Linked live room ID for joining the seminar */
  roomId?: string;
  /** Price in smallest currency unit (0 = free) */
  price?: number;
  /** تصویر/بنر سمینار (صفحه جزئیات) */
  thumbnailUrl?: string | null;
  /** ویدیو معرفی سمینار */
  videoUrl?: string | null;
  /** تگ‌ها (از API به صورت JSON یا آرایه) */
  tags?: string[];
  /** پیش‌نیازها (متن) */
  prerequisites?: string | null;
  /** سوالات متداول */
  faqs?: FAQ[];
  /** زمان پایان (از API) */
  endTime?: Date;
  /** ظرفیت (از API) */
  capacity?: number;
  /** رایگان یا پولی */
  isFree?: boolean;
  /** لینک ورود دستی */
  entryLink?: string | null;
  /** لینک اتاق آنلاین */
  roomLink?: string | null;
};

/** Client-side seminar registration (user registered + payment status) */
export type SeminarRegistration = {
  id: string;
  seminarId: string;
  userId: string;
  status: 'Pending' | 'Paid' | 'Cancelled';
  registeredAt: string;
  roomEntryLink?: string;
};

export type Ticket = {
  id: string;
  userName: string;
  userAvatarUrl?: string;
  userInitials: string;
  ticketNumber: string;
  timestamp: string;
};

export type Instructor = {
  id: string;
  name: string;
  avatarUrl?: string;
  initials: string;
  courseCount: number;
  rating: number;
};

export type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
};

export type TrafficSource = {
  name: string;
  value: number;
};

export type Sales = {
  month: string;
  sales: number;
};

export type Category = {
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
  categoryImage?: string;
  courseCount: number;
  createdAt: Date;
  parentId?: string | null;
  parentName?: string;
  children?: Category[];
  depth?: number;
};

export type CategoryChildSummary = {
  categoryId: string;
  categoryName: string;
  categoryImage?: string;
  courseCount: number;
};

export type CategoryDetail = Omit<Category, 'children'> & {
  children: CategoryChildSummary[];
};

export type CourseReview = {
  id:string;
  courseId: string;
  courseTitle: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  userInitials: string;
  rating: number;
  comment: string;
  createdAt: Date;
  status: 'Approved' | 'Pending' | 'Rejected';
  likes?: number;
  dislikes?: number;
  parentId?: string;
};

export type ArticleComment = {
  id: string;
  articleId: string;
  articleTitle: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  userInitials: string;
  comment: string;
  createdAt: Date;
  status: 'Approved' | 'Pending' | 'Rejected';
  likes: number;
  parentId?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  initials: string;
  status: 'Active' | 'Blocked';
  /** Parsed when API sends ISO; otherwise use registrationDateLabel. */
  registrationDate: Date;
  /** Parsed when API sends ISO; otherwise use lastLoginLabel. */
  lastLogin: Date;
  /** Pre-formatted label from API (e.g. Persian date text from search). */
  registrationDateLabel?: string;
  lastLoginLabel?: string;
  role: Role;
};

export type Order = {
  id: string;
  userId: string;
  date: Date;
  amount: number;
  itemCount: number;
  status: 'Completed' | 'Pending' | 'Failed';
};

export type UserActivity = {
  id: string;
  userId: string;
  type: 'course_enrollment' | 'seminar_registration' | 'article_view' | 'comment_post';
  description: string;
  date: Date;
};

export type TrainingPlan = {
  id: string;
  title: string;
  hourlyRate: number;
  totalHours: number;
  totalAmount: number;
  description: string;
  createdAt?: Date;
  managedRoomStudentId?: number;
  roomId?: number;
  ownerUserId?: number;
  startDateUtc?: string;
  endDateUtc?: string;
  usedMinutes?: number;
  remainingMinutes?: number;
  usedHours?: number;
  remainingHours?: number;
  studentFullName?: string;
  studentUserName?: string;
  roomTitle?: string;
  roomSlug?: string;
  paymentType?: 'cash' | 'installment';
  baseTotalCostToman?: number;
  finalTotalCostToman?: number;
  installments?: {
    installmentId: number;
    installmentNumber: number;
    dueDateUtc: string;
    amountToman: number;
    isPaid: boolean;
  }[];
};

export type AcademicRecord = {
  id: string;
  universityName: string;
  degreeType: 'Bachelors' | 'Masters' | 'PhD' | 'Certificate';
  degreeImage?: string;
};

export type Skill = {
  id: string;
  name: string;
  rate: number;
};

// === Seminar / Live Room Types (from ArkaSoftwareSeminar) ===
export type SeminarRoomRole = 'organizer' | 'admin' | 'presenter' | 'participant' | 'guest';

export type SeminarRoom = {
  id: string;
  name: string;
  organizerId: string;
  participants: string[];
  participantRoles: { [key: string]: SeminarRoomRole };
  allowGuests: boolean;
  requiresSeminarRegistration?: boolean;
  linkedSeminarId?: string | null;
  duration: number;
  guestLimit?: number;
  /** When true, students wait in lobby until a teacher joins (see MeetingHub). */
  teacherEntersFirst?: boolean;
  /** URL segment for `/room/[slug]` — used when redirecting students after session end. */
  slug?: string | null;
};

export type SeminarPaymentTransaction = {
  id: string;
  date: string;
  planId: string;
  planName: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
};

export type SeminarPlanHistoryItem = {
  id: string;
  startDate: string;
  endDate?: string;
  planName: string;
  totalHours: number;
  price: number;
  status: 'Active' | 'Expired' | 'Canceled' | 'Pending Payment';
};

export type SeminarPaymentPlan = {
  type: 'hourly' | 'package';
  paymentType: 'cash' | 'installment';
  planId: string;
  planName: string;
  totalHours: number;
  price: number;
  paidInstallments: number;
  totalInstallments: number;
  status: 'Active' | 'Pending Payment' | 'Overdue' | 'Suspended' | 'Settled';
  paymentConfirmed: boolean;
  nextPaymentDue: string;
};

export type SeminarClassSchedule = {
  id: string;
  date: string;
  className: string;
  startTime: string;
  endTime: string;
  description: string;
  status: 'pending' | 'completed';
};

export type SeminarUser = {
  id: string;
  name: string;
  displayName: string;
  username: string;
  password?: string;
  email: string;
  emailVerified: boolean;
  role: SeminarRoomRole;
  avatar: string;
  /** JWT from room login (catalog student) — optional for future hub/API use. */
  roomAccessToken?: string;
  /** True when this session came from room username/password (not dashboard site user). */
  isRoomSeatLogin?: boolean;
  /** Server-issued SignalR join ticket (separate from dashboard JWT). */
  roomJoinTicket?: string;
  contactNumber?: string;
  paymentPlan?: SeminarPaymentPlan;
  paymentHistory?: SeminarPaymentTransaction[];
  planHistory?: SeminarPlanHistoryItem[];
  classSchedule?: SeminarClassSchedule[];
};

export type RecordedItem = {
  id: string;
  name: string;
  url: string;
  duration: number;
  timestamp: number;
  size: number;
  fileExtension: string;
};
