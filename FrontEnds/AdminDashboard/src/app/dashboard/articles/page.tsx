
'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ArticleTable } from './components/article-table';
import { useLanguage } from '@/components/language-provider';
import { AddArticleModal } from './components/add-article-modal';
import type { Article } from '@/lib/types';

export default function ArticlesPage() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingArticle, setEditingArticle] = React.useState<Article | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleOpenModal = (article: Article | null = null) => {
    setEditingArticle(article);
    setIsModalOpen(true);
  };
  
  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('articles_title')}</h1>
        <Button size="sm" className="xs:text-sm" onClick={() => handleOpenModal()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('articles_new_button')}
        </Button>
      </div>
      <ArticleTable key={refreshKey} />
      <AddArticleModal
        open={isModalOpen}
        onOpenChangeAction={setIsModalOpen}
        article={editingArticle}
        onSuccessAction={handleSuccess}
      />
    </div>
  );
}
