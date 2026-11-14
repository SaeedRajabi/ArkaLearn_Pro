'use client';

import * as React from 'react';
import { Gem, GraduationCap, Monitor, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { formatCompactCount } from './professor-format';
import { useProfessorDashboard } from './professor-dashboard-context';

export function ProfessorDashboardStats({ dict }: { dict: Dictionary }) {
  const { profile, loading } = useProfessorDashboard();
  const { locale } = useLanguage();
  const localeTag = locale === 'fa' ? 'fa-IR' : 'en-US';

  if (loading && !profile) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  const participants = profile?.reviewCount ?? profile?.points ?? 0;
  const students = profile?.studentCount ?? 0;
  const courses = profile?.publishedCourseCount ?? 0;
  const followers = profile?.followerCount ?? 0;

  const cards = [
    {
      icon: Gem,
      value: formatCompactCount(participants, localeTag),
      label: getDictValue(dict, 'professorDashboard.stats.participants', 'Participants'),
      className: 'professor-dashboard__stat-card professor-dashboard__stat-card--cyan',
      iconClassName: 'text-cyan-600 dark:text-cyan-300',
    },
    {
      icon: GraduationCap,
      value: formatCompactCount(students, localeTag),
      label: getDictValue(dict, 'professorDashboard.stats.students', 'Students'),
      className: 'professor-dashboard__stat-card professor-dashboard__stat-card--violet',
      iconClassName: 'text-violet-600 dark:text-violet-300',
    },
    {
      icon: Monitor,
      value: String(courses),
      label: getDictValue(dict, 'professorDashboard.stats.courses', 'Courses'),
      className: 'professor-dashboard__stat-card professor-dashboard__stat-card--amber',
      iconClassName: 'text-amber-600 dark:text-amber-300',
    },
    {
      icon: Users,
      value: formatCompactCount(followers, localeTag),
      label: getDictValue(dict, 'professorDashboard.stats.followers', 'Followers'),
      className: 'professor-dashboard__stat-card professor-dashboard__stat-card--rose',
      iconClassName: 'text-rose-600 dark:text-rose-300',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={card.className}>
            <div className="flex items-center gap-4">
              <div className="professor-dashboard__stat-icon">
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
