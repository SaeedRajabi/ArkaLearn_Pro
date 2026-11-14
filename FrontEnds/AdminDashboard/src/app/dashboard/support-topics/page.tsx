'use client';

import { SupportTopicsManager } from './components/support-topics-manager';
import { useLanguage } from '@/components/language-provider';

export default function SupportTopicsPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('support_topics_page_title')}</h1>
        <p className="text-muted-foreground">{t('support_topics_page_description')}</p>
      </div>
      <SupportTopicsManager />
    </div>
  );
}
