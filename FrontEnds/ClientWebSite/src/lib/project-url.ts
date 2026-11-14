/**
 * Build the detail-page href for a project.
 *
 * Falls back to the numeric id when the stored slug is empty — the backend's
 * `Project/GetBySlug` endpoint resolves a numeric id to the project.
 */
export function getProjectDetailHref(project: { id?: string | number; slug?: string | null }): string {
  const slug = project.slug?.trim();
  if (slug) return `/projects/${encodeURIComponent(slug)}`;
  if (project.id != null) return `/projects/${project.id}`;
  return '/projects';
}
