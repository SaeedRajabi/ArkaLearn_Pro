
'use client';
import { SiteSettingsForm } from './components/site-settings-form';
import { useLanguage } from '@/components/language-provider';
import { RoleGuard } from '@/components/role-guard';

export default function SiteSettingsPage() {
  const { t } = useLanguage();
  return (
    <RoleGuard allowedRoles={['Admin']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">
            {t('client_site_settings_title')}
          </h1>
          <p className="text-muted-foreground">
            {t('client_site_settings_description')}
          </p>
        </div>
        <SiteSettingsForm />
      </div>
    </RoleGuard>
  );
}
