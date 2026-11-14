import type { TableExportColumn, TableExportFormat, TableExportOptions } from './types';

export type { TableExportColumn, TableExportFormat, TableExportOptions } from './types';

function cellValue<T>(row: T, column: TableExportColumn<T>): string {
  const raw = column.accessor(row);
  if (raw == null) return '';
  return String(raw).replace(/\s+/g, ' ').trim();
}

export function buildExportMatrix<T>(options: TableExportOptions<T>): {
  headers: string[];
  rows: string[][];
} {
  const headers = options.columns.map((column) => column.header);
  const rows = options.rows.map((row) =>
    options.columns.map((column) => cellValue(row, column))
  );
  return { headers, rows };
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').replace(/\s+/g, '-').slice(0, 120);
}

export function defaultExportFilename(title: string, extension: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${sanitizeFilename(title)}-${stamp}.${extension}`;
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportTableToCsv<T>(options: TableExportOptions<T>): Promise<void> {
  const { headers, rows } = buildExportMatrix(options);
  const lines = [headers.map(escapeCsvCell).join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))];
  const blob = new Blob(['\uFEFF', lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = options.filename.endsWith('.csv') ? options.filename : `${options.filename}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportTableToExcel<T>(options: TableExportOptions<T>): Promise<void> {
  const XLSX = await import('xlsx');
  const { headers, rows } = buildExportMatrix(options);
  const generatedAt = options.generatedAt ?? new Date();
  const metaRow =
    options.locale === 'fa'
      ? [`${options.title} — ${generatedAt.toLocaleString('fa-IR')}`]
      : [`${options.title} — ${generatedAt.toLocaleString('en-US')}`];

  const sheetData = [metaRow, [], headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  worksheet['!cols'] = headers.map((header, index) => {
    const maxCell = Math.max(
      header.length,
      ...rows.map((row) => (row[index] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxCell + 2, 12), 48) };
  });

  if (options.locale === 'fa') {
    worksheet['!views'] = [{ rightToLeft: true }];
  }

  const workbook = XLSX.utils.book_new();
  if (options.locale === 'fa') {
    workbook.Workbook = { Views: [{ RTL: true }] };
  }
  XLSX.utils.book_append_sheet(workbook, worksheet, options.locale === 'fa' ? 'گزارش' : 'Report');
  XLSX.writeFile(
    workbook,
    options.filename.endsWith('.xlsx') ? options.filename : `${options.filename}.xlsx`
  );
}

export async function exportTableToWord<T>(options: TableExportOptions<T>): Promise<void> {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import('docx');
  const { saveAs } = await import('file-saver');

  const isRtl = options.locale === 'fa';
  const alignment = isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT;
  const titleFont = isRtl ? 'B Nazanin' : 'Calibri';
  const bodyFont = isRtl ? 'B Nazanin' : 'Calibri Light';
  const { headers, rows } = buildExportMatrix(options);
  const generatedAt = options.generatedAt ?? new Date();

  const headerCells = headers.map(
    (header) =>
      new TableCell({
        shading: { fill: '1F4E79' },
        children: [
          new Paragraph({
            alignment,
            bidirectional: isRtl,
            children: [
              new TextRun({
                text: header,
                bold: true,
                color: 'FFFFFF',
                font: titleFont,
                size: 22,
                rightToLeft: isRtl,
              }),
            ],
          }),
        ],
      })
  );

  const bodyRows = rows.map(
    (row, rowIndex) =>
      new TableRow({
        children: row.map(
          (value) =>
            new TableCell({
              shading: { fill: rowIndex % 2 === 0 ? 'F5F8FC' : 'FFFFFF' },
              children: [
                new Paragraph({
                  alignment,
                  bidirectional: isRtl,
                  children: [
                    new TextRun({
                      text: value,
                      font: bodyFont,
                      size: 22,
                      rightToLeft: isRtl,
                    }),
                  ],
                }),
              ],
            })
        ),
      })
  );

  const doc = new Document({
    features: { updateFields: true },
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: isRtl ? AlignmentType.CENTER : AlignmentType.LEFT,
            bidirectional: isRtl,
            children: [
              new TextRun({
                text: options.title,
                bold: true,
                size: 36,
                font: titleFont,
                color: '1F4E79',
                rightToLeft: isRtl,
              }),
            ],
          }),
          new Paragraph({
            alignment,
            bidirectional: isRtl,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text:
                  options.locale === 'fa'
                    ? `تاریخ تهیه: ${generatedAt.toLocaleString('fa-IR')}`
                    : `Generated: ${generatedAt.toLocaleString('en-US')}`,
                font: bodyFont,
                size: 20,
                color: '666666',
                rightToLeft: isRtl,
              }),
            ],
          }),
          new Table({
            visuallyRightToLeft: isRtl,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: 'D0D7DE' },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D0D7DE' },
              left: { style: BorderStyle.SINGLE, size: 1, color: 'D0D7DE' },
              right: { style: BorderStyle.SINGLE, size: 1, color: 'D0D7DE' },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E6EBF1' },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E6EBF1' },
            },
            rows: [new TableRow({ children: headerCells }), ...bodyRows],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, options.filename.endsWith('.docx') ? options.filename : `${options.filename}.docx`);
}

export function exportTableToPrint<T>(options: TableExportOptions<T>): void {
  const { headers, rows } = buildExportMatrix(options);
  const isRtl = options.locale === 'fa';
  const generatedAt = options.generatedAt ?? new Date();
  const dir = isRtl ? 'rtl' : 'ltr';
  const align = isRtl ? 'right' : 'left';
  const fontFamily = isRtl ? "'Vazirmatn', 'B Nazanin', Tahoma, sans-serif" : "'Segoe UI', Calibri, sans-serif";

  const tableHead = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const tableBody = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="${isRtl ? 'fa' : 'en'}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(options.title)}</title>
  <style>
    @page { margin: 16mm; }
    body { font-family: ${fontFamily}; color: #111827; margin: 0; padding: 24px; direction: ${dir}; text-align: ${align}; }
    h1 { font-size: 22px; margin: 0 0 8px; color: #1f4e79; }
    .meta { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #1f4e79; color: #fff; padding: 10px 8px; border: 1px solid #d0d7de; }
    td { padding: 8px; border: 1px solid #e5e7eb; vertical-align: top; }
    tr:nth-child(even) td { background: #f8fafc; }
  </style>
</head>
<body>
  <h1>${escapeHtml(options.title)}</h1>
  <div class="meta">${
    isRtl
      ? `تاریخ چاپ: ${escapeHtml(generatedAt.toLocaleString('fa-IR'))}`
      : `Printed: ${escapeHtml(generatedAt.toLocaleString('en-US'))}`
  }</div>
  <table>
    <thead><tr>${tableHead}</tr></thead>
    <tbody>${tableBody}</tbody>
  </table>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=768');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.print();
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function exportTableData<T>(
  format: 'word' | 'excel' | 'csv' | 'print',
  options: TableExportOptions<T>
): Promise<void> {
  switch (format) {
    case 'csv':
      await exportTableToCsv(options);
      break;
    case 'excel':
      await exportTableToExcel(options);
      break;
    case 'word':
      await exportTableToWord(options);
      break;
    case 'print':
      exportTableToPrint(options);
      break;
    default:
      break;
  }
}
