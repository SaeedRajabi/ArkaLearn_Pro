'use client';

import * as React from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
  deletePlatformSoftware,
  searchPlatformSoftware,
  type SoftwareListItem,
} from '@/services/software-api.service';
import { AdminTableShell, type TableExportColumn } from '@/components/data-table';

type Props = {
  onEditAction: (item: SoftwareListItem) => void;
  refreshKey?: number;
};

function SoftwareCoverThumb({ coverImageUrl }: { coverImageUrl?: string }) {
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

export function SoftwareTable({ onEditAction, refreshKey = 0 }: Props) {
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const [items, setItems] = React.useState<SoftwareListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalCount, setTotalCount] = React.useState(0);
  const [reloadToken, setReloadToken] = React.useState(0);

  const exportColumns = React.useMemo<TableExportColumn<SoftwareListItem>[]>(
    () => [
      { header: t('software_col_title'), accessor: (row) => row.title },
      { header: t('software_col_category'), accessor: (row) => row.categoryName ?? '—' },
      { header: t('software_col_downloads'), accessor: (row) => row.downloadCount },
      { header: t('software_col_likes'), accessor: (row) => row.likeCount },
    ],
    [t]
  );

  const fetchAllItems = React.useCallback(async () => {
    const result = await searchPlatformSoftware({
      pageNumber: 1,
      pageSize: Math.max(totalCount, 1000),
    });
    return result.items;
  }, [totalCount]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [refreshKey, pageSize]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchPlatformSoftware({ pageNumber: currentPage, pageSize })
      .then((result) => {
        if (!cancelled) {
          setItems(result.items);
          setTotalCount(result.totalCount);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast({ title: t('software_load_failed'), variant: 'destructive' });
          setItems([]);
          setTotalCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentPage, pageSize, refreshKey, reloadToken, t, toast]);

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('software_delete_confirm'))) return;
    try {
      await deletePlatformSoftware(id);
      toast({ title: t('software_deleted') });
      if (items.length === 1 && currentPage > 1) {
        setCurrentPage((page) => Math.max(1, page - 1));
      }
      setReloadToken((token) => token + 1);
    } catch {
      toast({ title: t('software_delete_failed'), variant: 'destructive' });
    }
  };

  const textAlign = locale === 'fa' ? 'right' : 'left';

  return (
    <AdminTableShell
      title={t('software_table_title')}
      locale={locale}
      t={t}
      totalCount={totalCount}
      page={currentPage}
      pageSize={pageSize}
      onPageChange={setCurrentPage}
      onPageSizeChange={setPageSize}
      exportFilenameBase="software"
      exportTitle={t('software_table_title')}
      exportColumns={exportColumns}
      exportRows={items}
      fetchAllExportRows={fetchAllItems}
      loading={loading}
      isEmpty={!loading && items.length === 0}
      emptyMessage={t('software_empty')}
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead style={{ textAlign }}>{t('software_col_cover')}</TableHead>
            <TableHead style={{ textAlign }}>{t('software_col_title')}</TableHead>
            <TableHead style={{ textAlign }}>{t('software_col_category')}</TableHead>
            <TableHead style={{ textAlign }}>{t('software_col_downloads')}</TableHead>
            <TableHead style={{ textAlign }}>{t('software_col_likes')}</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-muted/30">
              <TableCell>
                <SoftwareCoverThumb coverImageUrl={item.coverImageUrl} />
              </TableCell>
              <TableCell className="font-medium">{item.title}</TableCell>
              <TableCell>{item.categoryName ?? '—'}</TableCell>
              <TableCell>{item.downloadCount}</TableCell>
              <TableCell>{item.likeCount}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditAction(item)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {t('software_edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('software_delete')}
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
