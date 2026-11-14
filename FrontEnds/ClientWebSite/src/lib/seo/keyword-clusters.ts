/**
 * Keyword clusters for programming-education SEO (FA primary, EN secondary).
 * Use page-specific clusters via `keywordsExtra` in buildPageMetadata / buildContentMetadata.
 */
export const SEO_KEYWORD_CLUSTERS = {
  /** Core brand + platform */
  brand: [
    'آرکا نرم افزار',
    'ArkaSoftware',
    'آموزشگاه آنلاین برنامه نویسی',
    'پلتفرم آموزش برنامه نویسی',
  ],
  /** High-volume course intents */
  courses: [
    'دوره برنامه نویسی',
    'آموزش برنامه نویسی آنلاین',
    'بهترین دوره برنامه نویسی',
    'آموزش پروژه محور',
    'دوره asp.net core',
    'آموزش react فارسی',
    'آموزش nextjs',
    'آموزش سی شارپ',
  ],
  /** Live events / webinars */
  seminars: [
    'سمینار برنامه نویسی',
    'وبینار آموزشی',
    'رویداد آنلاین برنامه نویسی',
  ],
  /** Content marketing */
  articles: [
    'مقالات برنامه نویسی',
    'آموزش برنامه نویسی رایگان',
    'آموزش کدنویسی',
    'راهنمای برنامه نویس شدن',
  ],
  /** Books & notes */
  books: [
    'کتاب برنامه نویسی',
    'جزوه برنامه نویسی',
    'دانلود کتاب برنامه نویسی',
  ],
  /** Portfolio / case studies */
  projects: [
    'پروژه برنامه نویسی',
    'نمونه کار برنامه نویسی',
    'پروژه asp.net core',
    'پروژه react',
  ],
  /** Teacher discovery */
  teachers: [
    'مدرس برنامه نویسی',
    'استاد برنامه نویسی',
    'آموزش خصوصی برنامه نویسی',
    'معلم خصوصی کدنویسی',
  ],
  /** Classified ads / tutoring listings */
  advertisements: [
    'آگهی تدریس برنامه نویسی',
    'تدریس خصوصی برنامه نویسی',
    'استخدام مدرس برنامه نویسی',
  ],
  /** Community Q&A */
  qa: [
    'پرسش و پاسخ برنامه نویسی',
    'سوال برنامه نویسی',
    'انجمن برنامه نویسان',
  ],
  /** Project outsourcing */
  orderProject: [
    'سفارش پروژه نرم افزار',
    'انجام پروژه برنامه نویسی',
    'برون‌سپاری توسعه نرم افزار',
  ],
  /** Contact / trust */
  contact: [
    'تماس با آرکا نرم افزار',
    'مشاوره برنامه نویسی',
  ],
} as const;

export type SeoKeywordCluster = keyof typeof SEO_KEYWORD_CLUSTERS;

export function getClusterKeywords(...clusters: SeoKeywordCluster[]): string[] {
  const merged = clusters.flatMap((key) => SEO_KEYWORD_CLUSTERS[key]);
  return [...new Set(merged)];
}
