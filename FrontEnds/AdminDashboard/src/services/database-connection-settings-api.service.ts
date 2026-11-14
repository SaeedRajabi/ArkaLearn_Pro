import apiClient from '@/lib/apiClient';

export type DatabaseConnectionSettingsPayload = {
  useDatabaseConnection: boolean;
  server: string;
  port?: number | null;
  database: string;
  userId: string;
  password?: string;
  hasPassword?: boolean;
  trustServerCertificate: boolean;
  multipleActiveResultSets: boolean;
  bootstrapSource?: string;
};

function unwrap<T>(raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const layer = root.data ?? root.Data ?? root;
  return (typeof layer === 'object' && layer !== null ? layer : root) as T;
}

const DEFAULTS: DatabaseConnectionSettingsPayload = {
  useDatabaseConnection: false,
  server: 'localhost',
  port: null,
  database: '',
  userId: '',
  trustServerCertificate: true,
  multipleActiveResultSets: true,
  bootstrapSource: 'BootstrapDB',
};

function mapRow(raw: Record<string, unknown>): DatabaseConnectionSettingsPayload {
  const portRaw = raw.port ?? raw.Port;
  return {
    ...DEFAULTS,
    useDatabaseConnection: Boolean(raw.useDatabaseConnection ?? raw.UseDatabaseConnection),
    server: String(raw.server ?? raw.Server ?? 'localhost'),
    port: portRaw == null || portRaw === '' ? null : Number(portRaw),
    database: String(raw.database ?? raw.Database ?? ''),
    userId: String(raw.userId ?? raw.UserId ?? ''),
    hasPassword: Boolean(raw.hasPassword ?? raw.HasPassword),
    trustServerCertificate: Boolean(raw.trustServerCertificate ?? raw.TrustServerCertificate ?? true),
    multipleActiveResultSets: Boolean(raw.multipleActiveResultSets ?? raw.MultipleActiveResultSets ?? true),
    bootstrapSource: String(raw.bootstrapSource ?? raw.BootstrapSource ?? 'BootstrapDB'),
  };
}

export async function getDatabaseConnectionSettings(): Promise<DatabaseConnectionSettingsPayload> {
  const res = await apiClient.get<unknown>('/DatabaseConnectionSettings/Get');
  const row = unwrap<Record<string, unknown>>(res.data);
  return row ? mapRow(row) : DEFAULTS;
}

export async function upsertDatabaseConnectionSettings(payload: DatabaseConnectionSettingsPayload): Promise<void> {
  const body: Record<string, unknown> = { ...payload };
  if (!payload.password?.trim()) delete body.password;
  await apiClient.post('/DatabaseConnectionSettings/Upsert', body);
}
