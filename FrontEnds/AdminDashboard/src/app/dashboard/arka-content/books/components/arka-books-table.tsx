'use client';

import * as React from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLanguage } from '@/components/language-provider';
import { useToast } from '@/hooks/use-toast';
import { resolveStaticAssetUrl, toSameOriginAssetSrc } from '@/lib/apiClient';
import {
  deleteArkaBook,
  getMyArkaBooks,
  getTeacherContentBooks,
  type ArkaBookItem,
  type ArkaContentApprovalStatus,
} from '@/services/arka-content-api.service';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

type Props = {
  onEditAction: (item: ArkaBookItem) => void;
  refreshKey?: number;
  teacherUserId?: string;
  cardTitle?: string;
};

function statusVariant(status: ArkaContentApprovalStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'approved') return 'default';
  if (status === 'pending') return 'secondary';
  if (status === 'rejected') return 'destructive';
  return 'outline';
}

function BookCoverThumb({ coverImageUrl }: { coverImageUrl?: string }) {
  const src = coverImageUrl
    ? (toSameOriginAssetSrc(coverImageUrl) ?? resolveStaticAssetUrl(coverImageUrl))
    : '';
  if (!src) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="relative h-10 w-16 overflow-hidden rounded border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
    </div>
  );
}

export function ArkaBooksTable({ onEditAction, refreshKey = 0, teacherUserId, cardTitle }: Props) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [items, setItems] = React.useState<ArkaBookItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [reloadToken, setReloadToken] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (teacherUserId ? getTeacherContentBooks(teacherUserId) : getMyArkaBooks())
      .then((books) => {
        if (!cancelled) setItems(books);
      })
      .catch(() => {
        if (!cancelled) {
          toast({ title: t('arka_books_load_failed'), variant: 'destructive' });
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey, reloadToken, t, toast, teacherUserId]);

  React.useEffect(() => {
    setPage(1);
  }, [pageSize, items.length]);

  const paginatedItems = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const statusLabel = (status: ArkaContentApprovalStatus) => t(`arka_content_status_${status}`);

  const exportColumns = React.useMemo<TableExportColumn<ArkaBookItem>[]>(() => {
    const cols: TableExportColumn<ArkaBookItem>[] = [
      { header: t('arka_books_col_title'), accessor: (row) => row.title },
    ];
    if (!teacherUserId) {
      cols.push({ header: t('arka_books_col_teacher'), accessor: (row) => row.teacherDisplayName || '—' });
    }
    cols.push(
      { header: t('arka_books_col_category'), accessor: (row) => row.categoryName || '—' },
      { header: t('arka_books_col_status'), accessor: (row) => statusLabel(row.approvalStatus) }
    );
    return cols;
  }, [t, teacherUserId]);

  const handleDelete = async (item: ArkaBookItem) => {
    if (!window.confirm(t('arka_books_delete_confirm'))) return;
    const ownerUserId = teacherUserId ?? (item.teacherUserId ? String(item.teacherUserId) : undefined);
    try {
      await deleteArkaBook(item.id, ownerUserId ? { teacherUserId: ownerUserId } : undefined);
      toast({ title: t('arka_books_deleted') });
      setReloadToken((k) => k + 1);
    } catch {
      toast({ title: t('arka_books_delete_failed'), variant: 'destructive' });
    }
  };

  return (
    <AdminTableShell
      title={cardTitle ?? t('arka_books_table_title')}
      locale={locale}
      t={t}
      totalCount={items.length}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      exportFilenameBase="arka-books"
      exportTitle={cardTitle ?? t('arka_books_table_title')}
      exportColumns={exportColumns}
      exportRows={paginatedItems}
      fetchAllExportRows={async () => items}
      loading={loading}
      isEmpty={!loading && items.length === 0}
      emptyMessage={t('arka_books_empty')}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('arka_books_col_cover')}</TableHead>
            <TableHead>{t('arka_books_col_title')}</TableHead>
            {!teacherUserId ? <TableHead>{t('arka_books_col_teacher')}</TableHead> : null}
            <TableHead>{t('arka_books_col_category')}</TableHead>
            <TableHead>{t('arka_books_col_status')}</TableHead>
            <TableHead className="w-[70px]">{t('arka_books_col_actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <BookCoverThumb coverImageUrl={item.coverImageUrl} />
              </TableCell>
              <TableCell className="font-medium">{item.title}</TableCell>
              {!teacherUserId ? <TableCell>{item.teacherDisplayName || '—'}</TableCell> : null}
              <TableCell>{item.categoryName || '—'}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(item.approvalStatus)}>{statusLabel(item.approvalStatus)}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditAction(item)}>
                      <Pencil className="me-2 h-4 w-4" />
                      {t('arka_content_edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => void handleDelete(item)}>
                      <Trash2 className="me-2 h-4 w-4" />
                      {t('arka_content_delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AdminTableShell>
  );
}
