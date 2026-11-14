'use client';

import * as React from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategoryTable } from './components/category-table';
import { CategoryFormModal } from './components/category-form-modal';
import { useLanguage } from '@/components/language-provider';

export default function CategoriesPage() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">
            {t('categories_page_title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('categories_page_description')}</p>
        </div>
        <Button size="sm" className="xs:text-sm" onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('add_category_button')}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('search_categories_placeholder')}
          className="pl-10"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <CategoryTable searchTerm={searchTerm} />

      <CategoryFormModal open={isModalOpen} onOpenChangeAction={setIsModalOpen} />
    </div>
  );
}
