import { apiRequest } from './client';

const BASE = 'ProjectOrder';

export async function submitProjectOrder(payload: {
  firstName: string;
  lastName: string;
  phone: string;
  title: string;
  projectType: string;
  otpSessionId?: string;
  otpCode?: string;
}): Promise<string> {
  const raw = await apiRequest<string | { data?: string }>(`${BASE}/Submit`, {
    method: 'POST',
    body: payload,
  });
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && 'data' in raw) {
    return String((raw as { data?: string }).data ?? '');
  }
  return String(raw ?? '');
}
