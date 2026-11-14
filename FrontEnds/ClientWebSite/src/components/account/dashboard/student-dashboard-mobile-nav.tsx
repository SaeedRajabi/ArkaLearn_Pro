'use client';

import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { DashboardMobileNavPicker } from '@/components/shared/dashboard-mobile-nav-picker';
import { getStudentDashboardMobileSections, type DashboardView } from './student-dashboard-nav';

export function StudentDashboardMobileNav({
  dict,
  activeView,
  setActiveView,
}: {
  dict: Dictionary;
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
}) {
  const { dir } = useLanguage();
  const sections = getStudentDashboardMobileSections(dict);

  return (
    <div className="lg:hidden">
      <DashboardMobileNavPicker
        sections={sections}
        value={activeView}
        onChange={(value) => setActiveView(value as DashboardView)}
        ariaLabel={getDictValue(dict, 'dashboard.mobileMenuLabel', 'Dashboard section')}
        isRtl={dir === 'rtl'}
      />
    </div>
  );
}
