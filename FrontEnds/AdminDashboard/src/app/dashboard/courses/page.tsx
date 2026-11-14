
'use client';

import * as React from 'react';
import {
  BookMarked,
  Clock,
  PlusCircle,
  Search,
  BookCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CourseTable } from './components/course-table';
import { StatsCard } from '../components/stats-card';
import { Input } from '@/components/ui/input';
import { CourseFormModal } from './components/course-form-modal';
import { useLanguage } from '@/components/language-provider';
import { useStore } from '@/lib/store';

export default function CoursesPage() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { courses } = useStore();

  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.status === 'Published').length;
  const draftCourses = courses.filter(c => c.status === 'Draft').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">
          {t('courses_title')}
        </h1>
        <Button
          size="sm"
          className="xs:text-sm"
          onClick={() => setIsModalOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('add_course_button')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title={t('stats_total_courses')}
          value={totalCourses.toLocaleString().toString().split("").map(x => t(x)).toString().replaceAll(",","")}
          icon={BookMarked}
          description={t('stats_total_courses_desc')}
        />
        <StatsCard
          title={t('stats_active_courses')}
          value={activeCourses.toLocaleString().toString().split("").map(x => t(x)).toString().replaceAll(",","")}
          icon={BookCheck}
          description={t('stats_active_courses_desc')}
        />
        <StatsCard
          title={t('stats_courses_in_progress')}
          value={draftCourses.toLocaleString().toString().split("").map(x => t(x)).toString().replaceAll(",","")}
          icon={Clock}
          description={t('stats_courses_in_progress_desc')}
        />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder={t('search_courses_placeholder')} className="pl-10" />
      </div>

      <CourseTable />

      <CourseFormModal open={isModalOpen} onOpenChangeAction={setIsModalOpen} />
    </div>
  );
}
