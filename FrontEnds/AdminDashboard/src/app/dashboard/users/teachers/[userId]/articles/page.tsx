'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/components/language-provider';
import { asLongId, isValidLongId } from '@/lib/id';
import { searchArticles } from '@/services/article-api.service';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

type ArticleRow = { id: number; title: string; isPublished: boolean };

export default function TeacherArticlesPage() {
  const params = useParams();
  const userId = asLongId(params.userId);
  const { t, locale } = useLanguage();
  const [items, setItems] = React.useState<ArticleRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const textAlign = locale === 'fa' ? 'right' : 'left';

  React.useEffect(() => {
    if (!isValidLongId(userId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void searchArticles({ authorUserId: userId, pageNumber: 1, pageSize: 500 })
      .then((res) => {
        setItems(res.items.map((a) => ({ id: a.id, title: a.title, isPublished: a.isPublished })));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [userId]);

  React.useEffect(() => {
    setPage(1);
  }, [pageSize, items.length]);

  const paginated = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const exportColumns = React.useMemo<TableExportColumn<ArticleRow>[]>(
    () => [
      { header: t('teacher_articles_col_title'), accessor: (row) => row.title },
      {
        header: t('teacher_articles_col_status'),
        accessor: (row) => (row.isPublished ? t('status_published') : t('status_draft')),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/users/teachers">
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('portal_students_back')}
        </Link>
      </Button>

      <AdminTableShell
        title={t('teacher_articles_title')}
        locale={locale}
        t={t}
        totalCount={items.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="teacher-articles"
        exportTitle={t('teacher_articles_title')}
        exportColumns={exportColumns}
        exportRows={paginated}
        fetchAllExportRows={async () => items}
        loading={loading}
        isEmpty={!loading && items.length === 0}
        emptyMessage={t('teacher_articles_empty')}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ textAlign }}>{t('teacher_articles_col_title')}</TableHead>
              <TableHead style={{ textAlign }}>{t('teacher_articles_col_status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <Link href={`/dashboard/articles/${a.id}`} className="hover:underline">
                    {a.title}
                  </Link>
                </TableCell>
                <TableCell>{a.isPublished ? t('status_published') : t('status_draft')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}
