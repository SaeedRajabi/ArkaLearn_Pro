'use client';

import * as React from 'react';
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  defaultExportFilename,
  exportTableData,
  type TableExportColumn,
  type TableExportFormat,
} from '@/lib/table-export';
import { useToast } from '@/hooks/use-toast';

type AdminTableExportMenuProps<T> = {
  title: string;
  filenameBase: string;
  columns: TableExportColumn<T>[];
  rows: T[];
  locale: 'fa' | 'en';
  t: (key: string) => string;
  fetchAllRows?: () => Promise<T[]>;
};

export function AdminTableExportMenu<T>({
  title,
  filenameBase,
  columns,
  rows,
  locale,
  t,
  fetchAllRows,
}: AdminTableExportMenuProps<T>) {
  const { toast } = useToast();
  const [exporting, setExporting] = React.useState<TableExportFormat | null>(null);

  const runExport = async (format: TableExportFormat) => {
    setExporting(format);
    try {
      const exportRows = fetchAllRows ? await fetchAllRows() : rows;
      if (exportRows.length === 0) {
        toast({
          variant: 'destructive',
          title: t('table_export_empty_title'),
          description: t('table_export_empty_description'),
        });
        return;
      }

      const extension =
        format === 'word' ? 'docx' : format === 'excel' ? 'xlsx' : format === 'csv' ? 'csv' : 'html';

      await exportTableData(format, {
        title,
        filename: defaultExportFilename(filenameBase, extension),
        columns,
        rows: exportRows,
        locale,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('table_export_failed_title'),
        description: t('table_export_failed_description'),
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={Boolean(exporting)}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {t('table_export_button')}
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={locale === 'fa' ? 'start' : 'end'} className="w-56">
        <DropdownMenuLabel>{t('table_export_menu_title')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void runExport('word')}>
          <FileText className="me-2 h-4 w-4" />
          {t('table_export_word')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void runExport('excel')}>
          <FileSpreadsheet className="me-2 h-4 w-4" />
          {t('table_export_excel')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void runExport('csv')}>
          <Download className="me-2 h-4 w-4" />
          {t('table_export_csv')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void runExport('print')}>
          <Printer className="me-2 h-4 w-4" />
          {t('table_export_print')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}