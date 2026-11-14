export type TableExportColumn<T> = {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
};

export type TableExportOptions<T> = {
  title: string;
  filename: string;
  columns: TableExportColumn<T>[];
  rows: T[];
  locale: 'fa' | 'en';
  generatedAt?: Date;
};

export type TableExportFormat = 'word' | 'excel' | 'csv' | 'print';
