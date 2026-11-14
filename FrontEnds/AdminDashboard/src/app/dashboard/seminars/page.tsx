

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { SeminarTable } from './components/seminar-table';
import { useLanguage } from '@/components/language-provider';
import { AddSeminarModal } from './components/add-seminar-modal';

export default function SeminarsPage() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleSeminarSaved = React.useCallback(() => {
    setRefreshKey((k) => k + 1);
    setIsModalOpen(false);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('seminars_title')}</h1>
        <Button size="sm" className="xs:text-sm" onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('add_seminar_button')}
        </Button>
      </div>
      <SeminarTable refreshKey={refreshKey} />
      <AddSeminarModal
        open={isModalOpen}
        onOpenChangeAction={setIsModalOpen}
        onSuccessAction={handleSeminarSaved}
      />
    </div>
  );
}
