'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/components/language-provider';
import {
  searchProjectQuestions,
  type SearchProjectQuestionItem,
} from '@/services/project-question-api.service';
import { useProjectQaHub } from '@/hooks/use-project-qa-hub';
import { playNotificationSound } from '@/lib/notification-sound';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'Approved') return 'default';
  if (status === 'Rejected') return 'destructive';
  return 'secondary';
}

export default function ProjectQuestionsPage() {
  const { t, locale } = useLanguage();
  const [items, setItems] = React.useState<SearchProjectQuestionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('Pending');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalCount, setTotalCount] = React.useState(0);

  const exportColumns = React.useMemo<TableExportColumn<SearchProjectQuestionItem>[]>(
    () => [
      {
        header: t('project_questions_col_project'),
        accessor: (row) => row.projectTitle || `#${row.projectId}`,
      },
      { header: t('project_questions_col_subject'), accessor: (row) => row.subject || '—' },
      { header: t('project_questions_col_author'), accessor: (row) => row.authorName || '—' },
      { header: t('project_questions_col_answers'), accessor: (row) => row.answerCount },
      { header: t('project_questions_col_status'), accessor: (row) => row.status },
      { header: t('project_questions_col_date'), accessor: (row) => row.createdAt },
    ],
    [t]
  );

  const fetchAllQuestions = React.useCallback(async () => {
    const result = await searchProjectQuestions({
      inputValue: search,
      status: status === 'all' ? '' : status,
      pageNumber: 1,
      pageSize: Math.max(totalCount, 1000),
    });
    return result.items;
  }, [search, status, totalCount]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchProjectQuestions({
        inputValue: search,
        status: status === 'all' ? '' : status,
        pageNumber: page,
        pageSize,
      });
      setItems(result.items);
      setTotalCount(result.totalCount);
    } catch {
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [search, status, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [search, status, pageSize]);

  React.useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  useProjectQaHub({
    isAdmin: true,
    handlers: {
      onQuestionSubmitted: () => {
        playNotificationSound();
        void load();
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight xs:text-3xl">{t('project_questions_title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('project_questions_description')}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t('project_questions_search_placeholder')}
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('project_questions_status_all')}</SelectItem>
            <SelectItem value="Pending">{t('project_questions_status_pending')}</SelectItem>
            <SelectItem value="Approved">{t('project_questions_status_approved')}</SelectItem>
            <SelectItem value="Rejected">{t('project_questions_status_rejected')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AdminTableShell
        title={t('project_questions_title')}
        description={t('project_questions_description')}
        locale={locale}
        t={t}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        exportFilenameBase="project-questions"
        exportTitle={t('project_questions_title')}
        exportColumns={exportColumns}
        exportRows={items}
        fetchAllExportRows={fetchAllQuestions}
        loading={loading}
        isEmpty={!loading && items.length === 0}
        emptyMessage={t('project_questions_empty')}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('project_questions_col_project')}</TableHead>
              <TableHead>{t('project_questions_col_subject')}</TableHead>
              <TableHead>{t('project_questions_col_author')}</TableHead>
              <TableHead>{t('project_questions_col_answers')}</TableHead>
              <TableHead>{t('project_questions_col_status')}</TableHead>
              <TableHead>{t('project_questions_col_date')}</TableHead>
              <TableHead className="text-right">{t('project_questions_col_actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.id}
                className={item.status === 'Pending' ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''}
              >
                <TableCell className="max-w-[160px] truncate">{item.projectTitle || `#${item.projectId}`}</TableCell>
                <TableCell className="max-w-[200px] truncate">{item.subject || '—'}</TableCell>
                <TableCell>{item.authorName || '—'}</TableCell>
                <TableCell>{item.answerCount}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.createdAt}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/project-questions/${item.id}`}>
                      <Eye className="h-4 w-4 me-1" />
                      {t('project_questions_view')}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}
