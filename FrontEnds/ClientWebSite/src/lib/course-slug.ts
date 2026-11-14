/** Build URL slug from course title (supports Persian and Latin). */
export function buildCourseSlug(title: string, courseId?: string | number): string {
  if (!title?.trim()) {
    return courseId != null ? `course-${courseId}` : 'course';
  }

  let slug = '';
  for (const ch of title.trim()) {
    if (/[\p{L}\p{N}]/u.test(ch)) {
      slug += ch.toLowerCase();
    } else if (/\s/.test(ch) || ch === '-' || ch === '_') {
      slug += '-';
    }
  }

  slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!slug) slug = courseId != null ? `course-${courseId}` : 'course';
  if (slug.length > 220) slug = slug.slice(0, 220).replace(/-$/, '');

  return slug;
}

export function getCoursePath(slug: string): string {
  return `/courses/${encodeURIComponent(slug.trim())}`;
}

export function getCourseUrl(course: { slug?: string; title?: string; id?: string | number; courseId?: number }): string {
  const id = course.id ?? course.courseId;
  const slug = course.slug?.trim() || buildCourseSlug(course.title ?? '', id);
  return getCoursePath(slug);
}

export function isNumericCourseSlug(slug: string): boolean {
  const decoded = decodeURIComponent(slug).trim();
  return /^\d+$/.test(decoded);
}
