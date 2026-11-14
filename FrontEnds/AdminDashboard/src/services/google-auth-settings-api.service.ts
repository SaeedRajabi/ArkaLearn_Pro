import apiClient from '@/lib/apiClient';

export type GoogleAuthSettingsPayload = {
  isEnabled: boolean;
  clientId: string;
  clientSecret?: string;
};

export type GoogleAuthSettingsResponse = Omit<GoogleAuthSettingsPayload, 'clientSecret'> & {
  hasClientSecret: boolean;
  configured?: boolean;
};

function unwrap<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  return (typeof layer === 'object' && layer !== null ? layer : root) as T;
}

export async function getGoogleAuthSettings(): Promise<GoogleAuthSettingsResponse> {
  const res = await apiClient.get<unknown>('/GoogleAuthSettings/Get');
  return (
    unwrap<GoogleAuthSettingsResponse>(res.data) ?? {
      isEnabled: true,
      clientId: '',
      hasClientSecret: false,
      configured: false,
    }
  );
}

export async function upsertGoogleAuthSettings(payload: GoogleAuthSettingsPayload): Promise<void> {
  await apiClient.post('/GoogleAuthSettings/Upsert', payload);
}
