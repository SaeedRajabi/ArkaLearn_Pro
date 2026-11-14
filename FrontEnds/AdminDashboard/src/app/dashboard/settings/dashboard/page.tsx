
'use client';
import { DashboardSettingsForm } from './components/dashboard-settings-form';
import { useLanguage } from '@/components/language-provider';

export default function DashboardSettingsPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('dashboard_settings_title')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard_settings_description')}
        </p>
      </div>
      <DashboardSettingsForm />
    </div>
  );
}
