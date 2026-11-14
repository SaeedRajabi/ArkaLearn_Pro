import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Download,
  FileText,
  GraduationCap,
  KeyRound,
  Layers,
  LayoutDashboard,
  CircleDollarSign,
  LineChart,
  Megaphone,
  MessageCircle,
  Monitor,
  MonitorSmartphone,
  Pencil,
  RefreshCw,
  Settings,
  Star,
  UserCircle,
  Users,
  Video,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';

export type ProfessorDashboardNavItem = {
  href: string;
  icon: LucideIcon;
  labelKey: string;
  exact?: boolean;
};

export type ProfessorDashboardNavLink = ProfessorDashboardNavItem & {
  type: 'link';
};

export type ProfessorDashboardNavGroup = {
  type: 'group';
  id: string;
  icon: LucideIcon;
  labelKey: string;
  items: ProfessorDashboardNavItem[];
};

export type ProfessorDashboardNavEntry = ProfessorDashboardNavLink | ProfessorDashboardNavGroup;

export const professorDashboardNavEntries: ProfessorDashboardNavEntry[] = [
  {
    type: 'link',
    href: '/professor',
    icon: LayoutDashboard,
    labelKey: 'professorDashboard.menu.dashboard',
    exact: true,
  },
  {
    type: 'group',
    id: 'teaching',
    icon: GraduationCap,
    labelKey: 'professorDashboard.menu.groups.teaching',
    items: [
      { href: '/professor/courses', icon: CalendarDays, labelKey: 'professorDashboard.menu.courses' },
      { href: '/professor/categories', icon: Layers, labelKey: 'professorDashboard.menu.categories' },
      { href: '/professor/exams', icon: ClipboardCheck, labelKey: 'professorDashboard.menu.exams' },
      { href: '/professor/question-bank', icon: Layers, labelKey: 'professorDashboard.menu.questionBank' },
      {
        href: '/professor/education-plans',
        icon: GraduationCap,
        labelKey: 'professorDashboard.menu.educationPlans',
      },
      { href: '/professor/online-rooms', icon: Video, labelKey: 'professorDashboard.menu.onlineRooms' },
    ],
  },
  {
    type: 'group',
    id: 'advertising',
    icon: Megaphone,
    labelKey: 'professorDashboard.menu.groups.advertising',
    items: [
      {
        href: '/professor/advertisements',
        icon: Megaphone,
        labelKey: 'professorDashboard.menu.advertisements',
      },
      { href: '/professor/videos', icon: Video, labelKey: 'professorDashboard.menu.videos' },
      { href: '/professor/articles', icon: FileText, labelKey: 'professorDashboard.menu.articles' },
      { href: '/professor/books', icon: BookOpen, labelKey: 'professorDashboard.menu.books' },
      { href: '/professor/software', icon: Download, labelKey: 'professorDashboard.menu.software' },
      {
        href: '/professor/advertisement-plans',
        icon: CreditCard,
        labelKey: 'professorDashboard.menu.adPlans',
      },
      {
        href: '/professor/manual-bump',
        icon: RefreshCw,
        labelKey: 'professorDashboard.menu.manualBump',
      },
    ],
  },
  {
    type: 'group',
    id: 'students',
    icon: Users,
    labelKey: 'professorDashboard.menu.groups.students',
    items: [
      { href: '/professor/students', icon: Users, labelKey: 'professorDashboard.menu.students' },
      {
        href: '/professor/desktop-licenses',
        icon: KeyRound,
        labelKey: 'professorDashboard.menu.desktopLicenses',
      },
      { href: '/professor/comments', icon: Star, labelKey: 'professorDashboard.menu.comments' },
      { href: '/professor/support', icon: MessageCircle, labelKey: 'professorDashboard.menu.support' },
      {
        href: '/professor/remote-assist',
        icon: MonitorSmartphone,
        labelKey: 'professorDashboard.menu.remoteAssist',
      },
    ],
  },
  {
    type: 'group',
    id: 'reports',
    icon: LineChart,
    labelKey: 'professorDashboard.menu.groups.reports',
    items: [
      { href: '/professor/analytics', icon: LineChart, labelKey: 'professorDashboard.menu.analytics' },
      { href: '/professor/earnings', icon: CircleDollarSign, labelKey: 'professorDashboard.menu.earnings' },
      { href: '/professor/wallet', icon: Wallet, labelKey: 'professorDashboard.menu.wallet' },
    ],
  },
  {
    type: 'group',
    id: 'account',
    icon: UserCircle,
    labelKey: 'professorDashboard.menu.groups.account',
    items: [
      { href: '/professor/profile', icon: Pencil, labelKey: 'professorDashboard.menu.editProfile' },
      {
        href: '/professor/desktop-app',
        icon: Monitor,
        labelKey: 'professorDashboard.menu.desktopApp',
      },
      { href: '/professor/settings', icon: Settings, labelKey: 'professorDashboard.menu.settings' },
    ],
  },
];

function resolveNavLabel(dict: Dictionary, labelKey: string, fallback: string) {
  return getDictValue(dict, labelKey, fallback);
}

function resolveItemLabel(dict: Dictionary, item: ProfessorDashboardNavItem) {
  return resolveNavLabel(dict, item.labelKey, item.href.split('/').pop() ?? '');
}

export function getProfessorDashboardNavEntries(dict: Dictionary) {
  return professorDashboardNavEntries.map((entry) => {
    if (entry.type === 'link') {
      return {
        ...entry,
        label: resolveItemLabel(dict, entry),
      };
    }

    return {
      ...entry,
      label: resolveNavLabel(dict, entry.labelKey, entry.id),
      items: entry.items.map((item) => ({
        ...item,
        label: resolveItemLabel(dict, item),
      })),
    };
  });
}

export function getProfessorDashboardNavFlatItems(dict: Dictionary) {
  const entries = getProfessorDashboardNavEntries(dict);
  const items: Array<ProfessorDashboardNavItem & { label: string }> = [];

  for (const entry of entries) {
    if (entry.type === 'link') {
      items.push(entry);
      continue;
    }

    items.push(...entry.items);
  }

  return items;
}

/** @deprecated Use getProfessorDashboardNavFlatItems or getProfessorDashboardNavEntries */
export function getProfessorDashboardNavItems(dict: Dictionary) {
  return getProfessorDashboardNavFlatItems(dict);
}

export function isProfessorDashboardNavActive(pathname: string, href: string, exact = false): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getProfessorDashboardNavLeafItems(): ProfessorDashboardNavItem[] {
  const items: ProfessorDashboardNavItem[] = [];

  for (const entry of professorDashboardNavEntries) {
    if (entry.type === 'link') {
      items.push(entry);
      continue;
    }

    items.push(...entry.items);
  }

  return items;
}

export function isProfessorDashboardNavGroupActive(pathname: string, group: ProfessorDashboardNavGroup): boolean {
  return group.items.some((item) => isProfessorDashboardNavActive(pathname, item.href, item.exact));
}

export function resolveProfessorDashboardNavHref(pathname: string): string {
  const match = getProfessorDashboardNavLeafItems().find((item) =>
    isProfessorDashboardNavActive(pathname, item.href, item.exact)
  );
  return match?.href ?? '/professor';
}

export function getProfessorDashboardNavMobileSections(dict: Dictionary) {
  return getProfessorDashboardNavEntries(dict)
    .map((entry) => {
      if (entry.type === 'link') {
        return {
          label: entry.label,
          items: [entry],
        };
      }

      return {
        label: entry.label,
        items: entry.items,
      };
    })
    .filter((section) => section.items.length > 0);
}
