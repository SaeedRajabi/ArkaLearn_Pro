'use client';

import { ContactSettingsForm } from './components/contact-settings-form';
import { useLanguage } from '@/components/language-provider';
import { RoleGuard } from '@/components/role-guard';

export default function ContactSettingsPage() {
  const { t } = useLanguage();
  return (
    <RoleGuard allowedRoles={['Admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">
            {t('contact_us_settings_title')}
          </h1>
          <p className="text-muted-foreground">{t('contact_us_settings_description')}</p>
        </div>
        <ContactSettingsForm />
      </div>
    </RoleGuard>
  );
}
