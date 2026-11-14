import { apiRequest, buildQuery } from './client';

const BASE = 'Student';

export type StudentProfile = {
  studentId: number;
  userId: number;
  displayName: string;
  userName: string;
  avatarUrl: string;
  headerImageUrl?: string;
};

function normalizeStudentProfile(raw: Record<string, unknown>): StudentProfile {
  return {
    studentId: Number(raw.studentId ?? raw.StudentId ?? 0),
    userId: Number(raw.userId ?? raw.UserId ?? 0),
    displayName: String(raw.displayName ?? raw.DisplayName ?? ''),
    userName: String(raw.userName ?? raw.UserName ?? ''),
    avatarUrl: String(raw.avatarUrl ?? raw.AvatarUrl ?? ''),
    headerImageUrl: String(raw.headerImageUrl ?? raw.HeaderImageUrl ?? '') || undefined,
  };
}

export async function getStudentProfile(params: {
  userId?: number;
  userName?: string;
}): Promise<StudentProfile | null> {
  try {
    const path = `${BASE}/GetProfile${buildQuery({
      userId: params.userId,
      userName: params.userName,
    })}`;
    const raw = await apiRequest<Record<string, unknown>>(path, { credentials: 'include' });
    if (!raw || typeof raw !== 'object') return null;
    const profile = normalizeStudentProfile(raw);
    if (!profile.studentId) return null;
    return profile;
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 404) {
      return null;
    }
    throw e;
  }
}

export async function updateStudentProfile(payload: {
  userId: number;
  headerImageUrl?: string | null;
}): Promise<void> {
  await apiRequest(`${BASE}/UpdateProfile`, {
    method: 'POST',
    credentials: 'include',
    body: {
      UserId: payload.userId,
      HeaderImageUrl: payload.headerImageUrl ?? '',
    },
  });
}
