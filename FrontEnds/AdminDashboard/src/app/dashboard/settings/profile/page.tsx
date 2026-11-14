
'use client';
import { ProfileSettingsForm } from './components/profile-settings-form';
import { useLanguage } from '@/components/language-provider';

export default function ProfileSettingsPage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('profile_settings_title')}</h1>
        <p className="text-muted-foreground">
          {t('profile_settings_description')}
        </p>
      </div>
      <ProfileSettingsForm />
    </div>
  );
}
