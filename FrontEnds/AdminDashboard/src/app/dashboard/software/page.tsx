
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import { SoftwareTable } from './components/software-table';
import { AddSoftwareModal } from './components/add-software-modal';
import type { SoftwareListItem } from '@/services/software-api.service';

export default function SoftwarePage() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SoftwareListItem | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleOpenModal = (item: SoftwareListItem | null = null) => {
    setEditing(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('software_title')}</h1>
        <Button size="sm" onClick={() => handleOpenModal()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('software_new_button')}
        </Button>
      </div>
      <SoftwareTable refreshKey={refreshKey} onEditAction={handleOpenModal} />
      <AddSoftwareModal
        open={isModalOpen}
        onOpenChangeAction={setIsModalOpen}
        software={editing}
        onSuccessAction={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
