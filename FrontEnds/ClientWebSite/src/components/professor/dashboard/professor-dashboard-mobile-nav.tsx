'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { DashboardMobileNavPicker } from '@/components/shared/dashboard-mobile-nav-picker';
import {
  getProfessorDashboardNavMobileSections,
  resolveProfessorDashboardNavHref,
} from './professor-dashboard-nav';
import { useProfessorNavPending } from './professor-dashboard-nav-pending';

export function ProfessorDashboardMobileNav({ dict }: { dict: Dictionary }) {
  const pathname = usePathname();
  const router = useRouter();
  const { dir } = useLanguage();
  const { beginPendingNavigation } = useProfessorNavPending();
  const sections = getProfessorDashboardNavMobileSections(dict).map((section) => ({
    label: section.label,
    items: section.items.map((item) => ({
      value: item.href,
      label: item.label,
      icon: item.icon,
    })),
  }));
  const currentHref = resolveProfessorDashboardNavHref(pathname);

  return (
    <div className="lg:hidden">
      <DashboardMobileNavPicker
        sections={sections}
        value={currentHref}
        onChange={(href) => {
          if (href === pathname) return;
          beginPendingNavigation(href);
          router.push(href);
        }}
        ariaLabel={getDictValue(dict, 'professorDashboard.mobileMenuLabel', 'Professor dashboard section')}
        isRtl={dir === 'rtl'}
      />
    </div>
  );
}
