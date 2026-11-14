import apiClient from '@/lib/apiClient';
import { unwrapApiList } from '@/lib/api/normalize-list';
import { getApiErrorMessage } from '@/lib/api-command-result';

export type DesktopAppReleaseRow = {
  id: number;
  version: string;
  installerUrl: string;
  releaseNotes: string | null;
  isMandatory: boolean;
  minSupportedVersion: string | null;
  publishedAtUtc: string;
  isPublished: boolean;
  publishedByAdminUserId: number | null;
};

export type PublishDesktopAppReleasePayload = {
  version: string;
  installerUrl: string;
  releaseNotes?: string;
  isMandatory: boolean;
  minSupportedVersion?: string;
};

function extractArray(raw: unknown): Record<string, unknown>[] {
  return unwrapApiList<Record<string, unknown>>(raw);
}

function mapRow(raw: Record<string, unknown>): DesktopAppReleaseRow {
  return {
    id: Number(raw.id ?? raw.Id ?? 0),
    version: String(raw.version ?? raw.Version ?? ''),
    installerUrl: String(raw.installerUrl ?? raw.InstallerUrl ?? ''),
    releaseNotes: (raw.releaseNotes ?? raw.ReleaseNotes ?? null) as string | null,
    isMandatory: Boolean(raw.isMandatory ?? raw.IsMandatory),
    minSupportedVersion: (raw.minSupportedVersion ?? raw.MinSupportedVersion ?? null) as string | null,
    publishedAtUtc: String(raw.publishedAtUtc ?? raw.PublishedAtUtc ?? ''),
    isPublished: Boolean(raw.isPublished ?? raw.IsPublished),
    publishedByAdminUserId:
      raw.publishedByAdminUserId != null || raw.PublishedByAdminUserId != null
        ? Number(raw.publishedByAdminUserId ?? raw.PublishedByAdminUserId)
        : null,
  };
}

export async function getDesktopAppReleases(): Promise<DesktopAppReleaseRow[]> {
  try {
    const res = await apiClient.get<unknown>('/DesktopApp/GetReleases');
    return extractArray(res.data).map((row) => mapRow(row));
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not load desktop releases.'));
  }
}

export async function publishDesktopAppRelease(payload: PublishDesktopAppReleasePayload): Promise<void> {
  try {
    await apiClient.post('/DesktopApp/PublishRelease', {
      version: payload.version.trim(),
      installerUrl: payload.installerUrl.trim(),
      releaseNotes: payload.releaseNotes?.trim() || undefined,
      isMandatory: payload.isMandatory,
      minSupportedVersion: payload.minSupportedVersion?.trim() || undefined,
    });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not publish desktop release.'));
  }
}

export async function unpublishDesktopAppRelease(releaseId: number): Promise<void> {
  try {
    await apiClient.post('/DesktopApp/UnpublishRelease', { releaseId });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not unpublish desktop release.'));
  }
}

export async function deleteDesktopAppRelease(releaseId: number): Promise<void> {
  try {
    await apiClient.post('/DesktopApp/DeleteRelease', { releaseId });
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Could not delete desktop release.'));
  }
}
