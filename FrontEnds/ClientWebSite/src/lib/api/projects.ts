import { apiRequest, buildQuery } from './client';
import type { PagedData, PagedResponseRaw, ProjectQri, SearchProjectQri } from './types';
import { normalizePagedResponse } from './types';

const BASE = 'Project';

export async function getProjectById(id: number): Promise<ProjectQri | null> {
  try {
    const path = `${BASE}/GetById${buildQuery({ projectId: id })}`;
    return await apiRequest<ProjectQri>(path);
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 204) {
      return null;
    }
    throw e;
  }
}

export async function getProjectBySlug(slug: string): Promise<ProjectQri | null> {
  try {
    const path = `${BASE}/GetBySlug${buildQuery({ slug })}`;
    return await apiRequest<ProjectQri>(path);
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 204) {
      return null;
    }
    throw e;
  }
}

export async function searchProjects(params: {
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
  needTotalCount?: boolean;
  publishedOnly?: boolean;
  tag?: string;
  technology?: string;
}): Promise<PagedData<SearchProjectQri>> {
  const {
    inputValue = '',
    pageNumber = 1,
    pageSize = 12,
    needTotalCount = true,
    publishedOnly = true,
    tag,
    technology,
  } = params;
  const q: Record<string, string | number | boolean> = {
    inputValue,
    pageNumber,
    pageSize,
    needTotalCount,
    publishedOnly,
  };
  if (tag) q.tag = tag;
  if (technology) q.technology = technology;
  const path = `${BASE}/Search${buildQuery(q)}`;
  const raw = await apiRequest<PagedResponseRaw<SearchProjectQri>>(path);
  return normalizePagedResponse(raw);
}
