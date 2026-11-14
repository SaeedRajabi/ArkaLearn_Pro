import {
  BookCopy,
  ClipboardList,
  FileCheck,
  FileText,
  FolderDown,
  Heart,
  LayoutDashboard,
  MessageCircle,
  MessagesSquare,
  Monitor,
  MonitorSmartphone,
  Presentation,
  Snowflake,
  User,
  Wallet,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';

export type DashboardView =
  | 'dashboard'
  | 'my-courses'
  | 'my-exams'
  | 'my-seminars'
  | 'education-plans'
  | 'invoices'
  | 'wallet'
  | 'shared-files'
  | 'favorites'
  | 'desktop-app'
  | 'support-chats'
  | 'support-freeze'
  | 'remote-assist'
  | 'profile';

export const STUDENT_DASHBOARD_VIEWS: DashboardView[] = [
  'dashboard',
  'my-courses',
  'my-exams',
  'my-seminars',
  'education-plans',
  'invoices',
  'wallet',
  'shared-files',
  'favorites',
  'desktop-app',
  'support-chats',
  'support-freeze',
  'remote-assist',
  'profile',
];

/** Views that live on a dedicated route instead of `/account?view=`. */
export const STUDENT_DASHBOARD_VIEW_HREFS: Partial<Record<DashboardView, string>> = {
  'desktop-app': '/account/desktop-app',
  'remote-assist': '/account/remote-assist',
};

export type StudentDashboardNavItem = {
  id: DashboardView;
  icon: LucideIcon;
  labelKey: string;
  href?: string;
};

export type StudentDashboardNavLink = StudentDashboardNavItem & {
  type: 'link';
};

export type StudentDashboardNavGroup = {
  type: 'group';
  id: string;
  icon: LucideIcon;
  labelKey: string;
  items: StudentDashboardNavItem[];
};

export type StudentDashboardNavEntry = StudentDashboardNavLink | StudentDashboardNavGroup;

export const studentDashboardNavEntries: StudentDashboardNavEntry[] = [
  {
    type: 'link',
    id: 'dashboard',
    icon: LayoutDashboard,
    labelKey: 'dashboard.menu.dashboard',
  },
  {
    type: 'group',
    id: 'learning',
    icon: GraduationCap,
    labelKey: 'dashboard.menu.groups.learning',
    items: [
      { id: 'my-courses', icon: BookCopy, labelKey: 'dashboard.menu.myCourses' },
      { id: 'my-exams', icon: FileCheck, labelKey: 'dashboard.menu.myExams' },
      { id: 'my-seminars', icon: Presentation, labelKey: 'dashboard.menu.mySeminars' },
      { id: 'education-plans', icon: ClipboardList, labelKey: 'dashboard.menu.educationPlans' },
    ],
  },
  {
    type: 'group',
    id: 'finance',
    icon: Wallet,
    labelKey: 'dashboard.menu.groups.finance',
    items: [
      { id: 'invoices', icon: FileText, labelKey: 'dashboard.menu.invoices' },
      { id: 'wallet', icon: Wallet, labelKey: 'dashboard.menu.wallet' },
    ],
  },
  {
    type: 'group',
    id: 'library',
    icon: FolderDown,
    labelKey: 'dashboard.menu.groups.library',
    items: [
      { id: 'shared-files', icon: FolderDown, labelKey: 'dashboard.menu.sharedFiles' },
      { id: 'favorites', icon: Heart, labelKey: 'dashboard.menu.favorites' },
      {
        id: 'desktop-app',
        icon: Monitor,
        labelKey: 'dashboard.menu.desktopApp',
        href: '/account/desktop-app',
      },
    ],
  },
  {
    type: 'group',
    id: 'support',
    icon: MessageCircle,
    labelKey: 'dashboard.menu.groups.support',
    items: [
      { id: 'support-chats', icon: MessagesSquare, labelKey: 'dashboard.menu.supportChats' },
      { id: 'support-freeze', icon: Snowflake, labelKey: 'dashboard.menu.supportFreeze' },
      {
        id: 'remote-assist',
        icon: MonitorSmartphone,
        labelKey: 'dashboard.menu.remoteAssist',
        href: '/account/remote-assist',
      },
    ],
  },
  {
    type: 'link',
    id: 'profile',
    icon: User,
    labelKey: 'dashboard.menu.profile',
  },
];

/** Legacy `?view=support` URLs from before the split. */
export function normalizeDashboardView(raw: string | null | undefined): DashboardView | null {
  if (!raw) return null;
  if (raw === 'support') return 'support-chats';
  return STUDENT_DASHBOARD_VIEWS.includes(raw as DashboardView) ? (raw as DashboardView) : null;
}

export function getStudentDashboardNavEntries(dict: Dictionary) {
  return studentDashboardNavEntries.map((entry) => {
    if (entry.type === 'link') {
      return {
        ...entry,
        label: getDictValue(dict, entry.labelKey, entry.id),
      };
    }

    return {
      ...entry,
      label: getDictValue(dict, entry.labelKey, entry.id),
      items: entry.items.map((item) => ({
        ...item,
        label: getDictValue(dict, item.labelKey, item.id),
      })),
    };
  });
}

export function flattenStudentDashboardNavItems(dict: Dictionary) {
  const entries = getStudentDashboardNavEntries(dict);
  return entries.flatMap((entry) => (entry.type === 'link' ? [entry] : entry.items));
}

export function getStudentDashboardViewLabel(dict: Dictionary, view: DashboardView): string {
  const item = flattenStudentDashboardNavItems(dict).find((row) => row.id === view);
  return item?.label ?? view.replace(/-/g, ' ');
}

export function isStudentDashboardNavGroupActive(activeView: DashboardView, group: StudentDashboardNavGroup) {
  return group.items.some((item) => item.id === activeView);
}

export function getStudentDashboardMobileSections(dict: Dictionary) {
  return getStudentDashboardNavEntries(dict)
    .filter((entry): entry is Extract<typeof entry, { type: 'group' }> => entry.type === 'group')
    .map((group) => ({
      label: group.label,
      items: group.items.map((item) => ({
        value: item.id,
        label: item.label,
        icon: item.icon,
      })),
    }))
    .concat([
      {
        label: getDictValue(dict, 'dashboard.menu.groups.general', 'General'),
        items: getStudentDashboardNavEntries(dict)
          .filter((entry): entry is Extract<typeof entry, { type: 'link' }> => entry.type === 'link')
          .map((item) => ({
            value: item.id,
            label: item.label,
            icon: item.icon,
          })),
      },
    ]);
}
