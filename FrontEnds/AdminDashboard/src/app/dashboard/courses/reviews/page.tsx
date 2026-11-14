
'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/language-provider';
import { ReviewTable } from './components/review-table';

export default function CourseReviewsPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">
          {t('course_reviews_title')}
        </h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder={t('search_reviews_placeholder')} className="pl-10" />
      </div>

      <ReviewTable />
    </div>
  );
}
