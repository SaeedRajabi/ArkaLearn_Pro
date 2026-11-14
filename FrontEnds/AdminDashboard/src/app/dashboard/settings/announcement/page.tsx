'use client';

import { AnnouncementSettingsForm } from './components/announcement-settings-form';
import { useLanguage } from '@/components/language-provider';
import { RoleGuard } from '@/components/role-guard';

export default function AnnouncementSettingsPage() {
  const { t } = useLanguage();
  return (
    <RoleGuard allowedRoles={['Admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">
            {t('site_announcement_page_title')}
          </h1>
          <p className="text-muted-foreground">{t('site_announcement_page_description')}</p>
        </div>
        <AnnouncementSettingsForm />
      </div>
    </RoleGuard>
  );
}
