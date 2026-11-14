import { apiRequest } from './client';

const BASE = 'Teacher';
const MAX_RESUME_BYTES = 50 * 1024 * 1024;

function parseUploadUrl(raw: unknown): { url: string; fileName?: string } {
  if (!raw || typeof raw !== 'object') return { url: '' };
  const row = raw as Record<string, unknown>;
  const nested = row.data ?? row.Data;
  const source = nested && typeof nested === 'object' && !Array.isArray(nested)
    ? (nested as Record<string, unknown>)
    : row;
  return {
    url: String(source.url ?? source.Url ?? ''),
    fileName: String(source.fileName ?? source.FileName ?? '') || undefined,
  };
}

export async function uploadTeacherResumePdf(file: File): Promise<{ url: string; fileName: string }> {
  if (file.size > MAX_RESUME_BYTES) {
    throw new Error('Resume PDF must be 50 MB or smaller.');
  }
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    throw new Error('Resume must be a PDF file.');
  }

  const form = new FormData();
  form.append('file', file);
  const raw = await apiRequest<unknown>(`${BASE}/UploadResumePdf`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const { url, fileName } = parseUploadUrl(raw);
  if (!url) throw new Error('Resume upload did not return a URL.');
  return { url, fileName: fileName ?? file.name };
}

export async function saveTeacherResume(payload: {
  title: string;
  description: string;
  pdfFileUrl: string;
  pdfFileName?: string;
}): Promise<void> {
  await apiRequest(`${BASE}/SaveResume`, {
    method: 'POST',
    credentials: 'include',
    body: {
      Title: payload.title,
      Description: payload.description,
      PdfFileUrl: payload.pdfFileUrl,
      PdfFileName: payload.pdfFileName ?? '',
    },
  });
}
