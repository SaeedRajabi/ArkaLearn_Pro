'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/language-provider';
import { ArkaBooksTable } from './components/arka-books-table';
import { AddArkaBookModal } from './components/add-arka-book-modal';
import type { ArkaBookItem } from '@/services/arka-content-api.service';

export default function ArkaBooksPage() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ArkaBookItem | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleOpenModal = (item: ArkaBookItem | null = null) => {
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
          <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('arka_books_title')}</h1>
          <p className="text-sm text-muted-foreground">{t('arka_books_description')}</p>
        </div>
        <Button size="sm" onClick={() => handleOpenModal()}>
          <PlusCircle className="me-2 h-4 w-4" />
          {t('arka_books_new_button')}
        </Button>
      </div>

      <ArkaBooksTable refreshKey={refreshKey} onEditAction={handleOpenModal} />
      <AddArkaBookModal
        open={isModalOpen}
        onOpenChangeAction={setIsModalOpen}
        book={editing}
        onSuccessAction={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
