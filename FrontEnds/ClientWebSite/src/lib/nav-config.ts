import {
  BookMarked,
  BookOpen,
  Download,
  FilePlus2,
  FileText,
  FolderKanban,
  FolderOpen,
  GraduationCap,
  Info,
  Megaphone,
  MessagesSquare,
  Phone,
  Presentation,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
export type NavLinkItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

export type NavGroupItem = {
  type: 'group';
  labelKey: string;
  icon: LucideIcon;
  items: NavLinkItem[];
};

export type NavSingleItem = {
  type: 'link';
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

export type HeaderNavItem = NavGroupItem | NavSingleItem;

export const headerNavItems: HeaderNavItem[] = [
  {
    type: 'group',
    labelKey: 'arkaSoftware',
    icon: Sparkles,
    items: [
      { href: '/courses', labelKey: 'courses', icon: BookOpen },
      { href: '/seminars', labelKey: 'seminars', icon: Presentation },
      { href: '/articles', labelKey: 'articles', icon: FileText },
      { href: '/books', labelKey: 'books', icon: BookMarked },
      { href: '/software', labelKey: 'software', icon: Download },
    ],
  },
  {
    type: 'group',
    labelKey: 'projectsMenu',
    icon: FolderKanban,
    items: [
      { href: '/projects', labelKey: 'projectsList', icon: FolderOpen },
      { href: '/order-project', labelKey: 'projectRequests', icon: FilePlus2 },
    ],
  },
  { type: 'link', href: '/advertisements', labelKey: 'advertisements', icon: Megaphone },
  { type: 'link', href: '/teachers', labelKey: 'teachers', icon: GraduationCap },
  { type: 'link', href: '/qa', labelKey: 'qa', icon: MessagesSquare },
  { type: 'link', href: '/about', labelKey: 'about', icon: Info },
  { type: 'link', href: '/contact', labelKey: 'contact', icon: Phone },
];
export function resolveNavLabel(
  headerDic: Record<string, string | undefined>,
  labelKey: string,
  lang: 'en' | 'fa'
): string {
  const value = headerDic[labelKey];
  if (value) return value;

  const fallbacks: Record<string, Record<'en' | 'fa', string>> = {
    arkaSoftware: { en: 'Arka Software', fa: 'آرکا نرم‌افزار' },
    projectsMenu: { en: 'Projects', fa: 'پروژه‌ها' },
    courses: { en: 'Courses', fa: 'دوره‌ها' },
    seminars: { en: 'Seminars', fa: 'سمینارها' },
    articles: { en: 'Articles', fa: 'مقالات' },
    books: { en: 'Books & notes', fa: 'کتاب‌ها و جزوات' },
    software: { en: 'Software', fa: 'نرم‌افزارها' },
    advertisements: { en: 'Advertisements', fa: 'آگهی‌ها' },
    teachers: { en: 'Teachers', fa: 'اساتید' },
    contact: { en: 'Contact', fa: 'تماس با ما' },
    projects: { en: 'Projects', fa: 'پروژه‌ها' },
    projectsList: { en: 'Projects', fa: 'پروژه‌ها' },
    projectRequests: { en: 'Project requests', fa: 'درخواست پروژه' },
    orderProject: { en: 'Order Project', fa: 'سفارش پروژه' },
    qa: { en: 'Community Q&A', fa: 'پرسش و پاسخ' },
    about: { en: 'About Us', fa: 'درباره ما' },
  };

  return fallbacks[labelKey]?.[lang] ?? labelKey;
}
