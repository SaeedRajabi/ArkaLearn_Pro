import apiClient from '@/lib/apiClient';
import { unwrapApiList } from '@/lib/api/normalize-list';
import { getApiErrorMessage } from '@/lib/api-command-result';

export type DesktopDeviceRow = {
  id: number;
  userId: number;
  deviceId: string;
  machineName: string | null;
  osVersion: string | null;
  appVersion: string | null;
  registeredAtUtc: string;
  lastHeartbeatAtUtc: string;
  isBlocked: boolean;
};

export type DesktopAccessBlockRow = {
  id: number;
  userId: number;
  scope: number;
  reason: string | null;
  blockedAtUtc: string;
  unblockedAtUtc: string | null;
  isActive: boolean;
};

function mapDevice(raw: Record<string, unknown>): DesktopDeviceRow {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    userId: Number(raw.userId ?? raw.UserId ?? 0),
    deviceId: String(raw.deviceId ?? raw.DeviceId ?? ''),
    machineName: (raw.machineName ?? raw.MachineName ?? null) as string | null,
    osVersion: (raw.osVersion ?? raw.OsVersion ?? null) as string | null,
    appVersion: (raw.appVersion ?? raw.AppVersion ?? null) as string | null,
    registeredAtUtc: String(raw.registeredAtUtc ?? raw.RegisteredAtUtc ?? ''),
    lastHeartbeatAtUtc: String(raw.lastHeartbeatAtUtc ?? raw.LastHeartbeatAtUtc ?? ''),
    isBlocked: Boolean(raw.isBlocked ?? raw.IsBlocked),
  };
}

function mapBlock(raw: Record<string, unknown>): DesktopAccessBlockRow {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    userId: Number(raw.userId ?? raw.UserId ?? 0),
    scope: Number(raw.scope ?? raw.Scope ?? 0),
    reason: (raw.reason ?? raw.Reason ?? null) as string | null,
    blockedAtUtc: String(raw.blockedAtUtc ?? raw.BlockedAtUtc ?? ''),
    unblockedAtUtc: (raw.unblockedAtUtc ?? raw.UnblockedAtUtc ?? null) as string | null,
    isActive: Boolean(raw.isActive ?? raw.IsActive),
  };
}

export async function getDesktopDevices(userId?: number): Promise<DesktopDeviceRow[]> {
  try {
    const params = new URLSearchParams();
    if (userId && userId > 0) params.set('userId', String(userId));
    params.set('take', '200');
    const qs = params.toString();
    const res = await apiClient.get<unknown>(`/DesktopDrm/GetDeviceRegistrations${qs ? `?${qs}` : ''}`);
    return unwrapApiList<Record<string, unknown>>(res.data).map(mapDevice);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not load desktop devices.'));
  }
}

export async function getDesktopAccessBlocks(userId?: number): Promise<DesktopAccessBlockRow[]> {
  try {
    const params = new URLSearchParams();
    if (userId && userId > 0) params.set('userId', String(userId));
    params.set('activeOnly', 'true');
    params.set('take', '200');
    const res = await apiClient.get<unknown>(`/DesktopDrm/GetAccessBlocks?${params.toString()}`);
    return unwrapApiList<Record<string, unknown>>(res.data).map(mapBlock);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not load access blocks.'));
  }
}

export async function blockDesktopDevice(deviceRegistrationId: number): Promise<void> {
  try {
    await apiClient.post('/DesktopDrm/BlockDevice', { deviceRegistrationId });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not block device.'));
  }
}

export async function unblockDesktopDevice(deviceRegistrationId: number): Promise<void> {
  try {
    await apiClient.post('/DesktopDrm/UnblockDevice', { deviceRegistrationId });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not unblock device.'));
  }
}

export async function blockDesktopUserAccess(payload: {
  userId: number;
  scope: number;
  reason?: string;
}): Promise<void> {
  try {
    await apiClient.post('/DesktopDrm/BlockUserAccess', payload);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not block user access.'));
  }
}

export async function unblockDesktopUserAccess(accessBlockId: number): Promise<void> {
  try {
    await apiClient.post('/DesktopDrm/UnblockUserAccess', { accessBlockId });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not unblock user access.'));
  }
}
