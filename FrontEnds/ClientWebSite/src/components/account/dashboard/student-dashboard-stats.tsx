'use client';

import { useEffect, useState } from 'react';
import { Award, ClipboardCheck, Monitor } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { getMyCourses } from '@/lib/api/courses';
import { getMyRegisteredSeminars } from '@/lib/api/seminars';
import { getDictValue } from '@/lib/i18n-client';
import { formatCompactCount } from '@/components/professor/dashboard/professor-format';
import type { Dictionary } from '@/types';

export function StudentDashboardStats({
  dict,
  enrolledCoursesCount = 0,
}: {
  dict: Dictionary;
  enrolledCoursesCount?: number;
}) {
  const { locale } = useLanguage();
  const localeTag = locale === 'fa' ? 'fa-IR' : 'en-US';
  const [coursesCount, setCoursesCount] = useState(enrolledCoursesCount);
  const [seminarsCount, setSeminarsCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [courses, seminars] = await Promise.all([getMyCourses(), getMyRegisteredSeminars()]);
        if (cancelled) return;
        setCoursesCount(Array.isArray(courses) ? courses.length : enrolledCoursesCount);
        setSeminarsCount(Array.isArray(seminars) ? seminars.length : 0);
      } catch {
        if (!cancelled) {
          setCoursesCount(enrolledCoursesCount);
          setSeminarsCount(0);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [enrolledCoursesCount]);

  const certificates = Math.max(0, Math.floor(coursesCount * 0.6));

  const cards = [
    {
      icon: Monitor,
      value: String(coursesCount),
      label: getDictValue(dict, 'dashboard.stats.courses', 'Courses'),
      className: 'student-dashboard__stat-card student-dashboard__stat-card--amber',
      iconClassName: 'text-amber-600 dark:text-amber-300',
    },
    {
      icon: ClipboardCheck,
      value: formatCompactCount(seminarsCount, localeTag),
      label: getDictValue(dict, 'dashboard.stats.videos', 'Videos'),
      className: 'student-dashboard__stat-card student-dashboard__stat-card--violet',
      iconClassName: 'text-violet-600 dark:text-violet-300',
    },
    {
      icon: Award,
      value: String(certificates),
      label: getDictValue(dict, 'dashboard.stats.certificates', 'Certificates'),
      className: 'student-dashboard__stat-card student-dashboard__stat-card--green',
      iconClassName: 'text-green-600 dark:text-green-300',
    },
  ];

  return (
    <div className="grid gap-4 pb-6 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={card.className}>
            <div className="flex items-center gap-4">
              <div className="student-dashboard__stat-icon">
                <Icon className={card.iconClassName} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
