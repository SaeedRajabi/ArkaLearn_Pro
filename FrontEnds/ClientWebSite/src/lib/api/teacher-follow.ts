import { apiRequest } from './client';

const BASE = 'Teacher';

export async function followTeacher(teacherId: number): Promise<void> {
  await apiRequest(`${BASE}/FollowTeacher`, {
    method: 'POST',
    credentials: 'include',
    body: { TeacherId: teacherId },
  });
}

export async function unfollowTeacher(teacherId: number): Promise<void> {
  await apiRequest(`${BASE}/UnfollowTeacher`, {
    method: 'POST',
    credentials: 'include',
    body: { TeacherId: teacherId },
  });
}
