import {
  BookMarked,
  BookOpen,
  Download,
  FileText,
  FolderKanban,
  Presentation,
  type LucideIcon,
} from 'lucide-react';

export type NavContentSectionId = 'courses' | 'articles' | 'seminars' | 'projects' | 'books' | 'software';

export type NavContentSection = {
  id: NavContentSectionId;
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

export const NAV_CONTENT_SECTIONS: NavContentSection[] = [
  { id: 'courses', href: '/courses', labelKey: 'courses', icon: BookOpen },
  { id: 'articles', href: '/articles', labelKey: 'articles', icon: FileText },
  { id: 'seminars', href: '/seminars', labelKey: 'seminars', icon: Presentation },
  { id: 'projects', href: '/projects', labelKey: 'projectsList', icon: FolderKanban },
  { id: 'books', href: '/books', labelKey: 'books', icon: BookMarked },
  { id: 'software', href: '/software', labelKey: 'software', icon: Download },
];

export function buildCategoryBrowseUrl(_section: NavContentSectionId, categoryId: number): string {
  return `/categories/${categoryId}`;
}

export function buildCategoryBrowseUrlFromId(categoryId: number): string {
  return `/categories/${categoryId}`;
}
