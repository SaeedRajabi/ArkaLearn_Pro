'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/language-provider';
import { asLongId, isValidLongId } from '@/lib/id';
import { AdminSupportChatWorkspace } from '../components/admin-support-chat-workspace';

export default function SupportManagementTeacherPage() {
  const { t, direction } = useLanguage();
  const params = useParams();
  const searchParams = useSearchParams();
  const teacherUserId = asLongId(params.teacherUserId);
  const teacherName = searchParams.get('name') ?? t('admin_support_teacher_fallback');

  if (!isValidLongId(teacherUserId)) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t('admin_support_invalid_teacher')}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/support-management">{t('admin_support_back_list')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1 px-2">
          <Link href="/dashboard/support-management">
            <ChevronLeft className={direction === 'rtl' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            {t('admin_support_back_list')}
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{teacherName}</h1>
        <p className="text-muted-foreground">{t('admin_support_teacher_page_desc')}</p>
      </div>
      <AdminSupportChatWorkspace teacherUserId={teacherUserId} teacherName={teacherName} />
    </div>
  );
}
