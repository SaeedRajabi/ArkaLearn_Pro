import apiClient from '@/lib/apiClient';

export type EmailSettingsPayload = {
  isEnabled: boolean;
  host: string;
  port: number;
  useSsl: boolean;
  useStartTls: boolean;
  allowInvalidCertificate: boolean;
  username: string;
  password?: string;
  fromEmail: string;
  fromName: string;
  timeoutSeconds: number;
  requireEmailVerification: boolean;
  otpExpiryMinutes: number;
  otpResendCooldownSeconds: number;
  passwordResetLinkExpiryMinutes: number;
  passwordChangeUseSms: boolean;
};

export type EmailSettingsResponse = Omit<EmailSettingsPayload, 'password'> & {
  hasPassword: boolean;
};

function unwrap<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  return (typeof layer === 'object' && layer !== null ? layer : root) as T;
}

export async function getEmailSettings(): Promise<EmailSettingsResponse> {
  const res = await apiClient.get<unknown>('/EmailSettings/Get');
  return (
    unwrap<EmailSettingsResponse>(res.data) ?? {
      isEnabled: false,
      hasPassword: false,
      host: '',
      port: 587,
      useSsl: false,
      useStartTls: true,
      allowInvalidCertificate: true,
      username: '',
      fromEmail: '',
      fromName: 'ArkaSoftware',
      timeoutSeconds: 30,
      requireEmailVerification: true,
      otpExpiryMinutes: 10,
      otpResendCooldownSeconds: 120,
      passwordResetLinkExpiryMinutes: 15,
      passwordChangeUseSms: false,
    }
  );
}

export async function upsertEmailSettings(payload: EmailSettingsPayload): Promise<void> {
  await apiClient.post('/EmailSettings/Upsert', payload);
}

export async function testEmailDelivery(toEmail: string, recipientName?: string): Promise<void> {
  await apiClient.post('/Email/Test', { toEmail, recipientName: recipientName ?? 'Test User' });
}
