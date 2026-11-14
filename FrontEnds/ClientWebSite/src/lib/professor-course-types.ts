/** Admin-dashboard compatible course shape for the professor course form. */
export type ProfessorAdminFAQ = { id: string; question: string; answer: string };

export type ProfessorAdminLesson = {
  id: string;
  title: string;
  videoTitle?: string;
  videoUrl?: string;
  durationSeconds?: number;
  hasVideo?: boolean;
  videoFile?: File;
  mediaAssetId?: number | string;
  removeVideo?: boolean;
  isPublished?: boolean;
};

export type ProfessorAdminSection = {
  id: string;
  title: string;
  lessons: ProfessorAdminLesson[];
};

export type ProfessorAdminCourse = {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
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
  thumbnailUrl?: string | File;
  videoUrl?: string | File;
  isSpecial?: boolean;
  specialDetails?: string;
  tags?: string[];
  prerequisites?: string;
  faqs?: ProfessorAdminFAQ[];
  sections?: ProfessorAdminSection[];
  degreeRequired: boolean;
  deliveryMode?: 'directDownload' | 'desktopLicense';
  lifecyclePhase?: 'notStarted' | 'inProgress' | 'ended';
  registrationDeadlineUtc?: string;
  courseStartUtc?: string;
  courseEndUtc?: string;
  registrationClosed?: boolean;
  seoTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
};
