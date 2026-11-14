import apiClient from '@/lib/apiClient';

export type EmailTemplateListItem = {
  templateKey: string;
  displayName: string;
  description: string;
  isEnabled: boolean;
  isCustomized: boolean;
};

export type EmailTemplateDetail = EmailTemplateListItem & {
  subject: string;
  bodyHtml: string;
};

function unwrap<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  return (typeof layer === 'object' && layer !== null ? layer : root) as T;
}

function normalizeListItem(raw: Record<string, unknown>): EmailTemplateListItem {
  return {
    templateKey: String(raw.templateKey ?? raw.TemplateKey ?? ''),
    displayName: String(raw.displayName ?? raw.DisplayName ?? ''),
    description: String(raw.description ?? raw.Description ?? ''),
    isEnabled: Boolean(raw.isEnabled ?? raw.IsEnabled ?? true),
    isCustomized: Boolean(raw.isCustomized ?? raw.IsCustomized ?? false),
  };
}

function normalizeDetail(raw: Record<string, unknown>): EmailTemplateDetail {
  return {
    ...normalizeListItem(raw),
    subject: String(raw.subject ?? raw.Subject ?? ''),
    bodyHtml: String(raw.bodyHtml ?? raw.BodyHtml ?? ''),
  };
}

export async function listEmailTemplates(): Promise<EmailTemplateListItem[]> {
  const res = await apiClient.get<unknown>('/EmailTemplates/List');
  const data = unwrap<unknown[]>(res.data);
  if (!Array.isArray(data)) return [];
  return data
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === 'object')
    .map(normalizeListItem);
}

export async function getEmailTemplateByKey(templateKey: string): Promise<EmailTemplateDetail | null> {
  const res = await apiClient.get<unknown>('/EmailTemplates/GetByKey', {
    params: { templateKey },
  });
  const data = unwrap<Record<string, unknown>>(res.data);
  return data ? normalizeDetail(data) : null;
}

export async function upsertEmailTemplate(payload: {
  templateKey: string;
  displayName: string;
  description: string;
  subject: string;
  bodyHtml: string;
  isEnabled: boolean;
}): Promise<void> {
  await apiClient.post('/EmailTemplates/Upsert', payload);
}

export async function resetEmailTemplate(templateKey: string): Promise<void> {
  await apiClient.post('/EmailTemplates/Reset', { templateKey });
}
