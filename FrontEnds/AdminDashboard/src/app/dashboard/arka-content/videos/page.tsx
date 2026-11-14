'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/language-provider';
import { ArkaVideosTable } from './components/arka-videos-table';
import { AddArkaVideoModal } from './components/add-arka-video-modal';
import type { ArkaPromotionalVideoItem } from '@/services/arka-content-api.service';

export default function ArkaVideosPage() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ArkaPromotionalVideoItem | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleOpenModal = (item: ArkaPromotionalVideoItem | null = null) => {
    setEditing(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ms-2 h-8 px-2">
            <Link href="/dashboard/arka-content">
              <ArrowLeft className="me-2 h-4 w-4" />
              {t('arka_content_back')}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('arka_videos_title')}</h1>
          <p className="text-sm text-muted-foreground">{t('arka_videos_description')}</p>
        </div>
        <Button size="sm" onClick={() => handleOpenModal()}>
          <PlusCircle className="me-2 h-4 w-4" />
          {t('arka_videos_new_button')}
        </Button>
      </div>

      <ArkaVideosTable refreshKey={refreshKey} onEditAction={handleOpenModal} />
      <AddArkaVideoModal
        open={isModalOpen}
        onOpenChangeAction={setIsModalOpen}
        video={editing}
        onSuccessAction={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
