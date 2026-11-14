import type { TeacherAdvertisementListItem } from '@/lib/api/teacher-advertisements';

export function getAdvertisementDetailHref(item: TeacherAdvertisementListItem): string {
  const userName = item.teacherUserName?.trim();
  if (userName) {
    return `/advertisements/${encodeURIComponent(userName)}`;
  }
  if (item.teacherId > 0) {
    return `/advertisements/${item.teacherId}`;
  }
  return `/advertisements/${item.id}`;
}

export function resolveAdvertisementSlug(slug: string): { userName?: string; teacherId?: number } {
  const decoded = decodeURIComponent(slug).trim();
  if (/^\d+$/.test(decoded)) {
    const teacherId = Number(decoded);
    if (teacherId > 0) return { teacherId };
  }
  return { userName: decoded };
}
