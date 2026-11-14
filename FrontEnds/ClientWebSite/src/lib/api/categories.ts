import { apiRequest, buildQuery } from './client';
import { normalizePagedResponse, type PagedResponseRaw } from './types';

const BASE = 'Category';

export type CategoryListItem = {
  id: number;
  categoryName: string;
  description?: string;
};

export type CategoryTreeItem = {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  courseCount: number;
  createdAt?: string;
  children: CategoryTreeItem[];
};

export type AddCategoryParams = {
  categoryName: string;
  description: string;
  parentId?: number | null;
  categoryImage?: File | null;
};

function extractValues<T>(value: T[] | { $values?: T[] } | null | undefined): T[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object' && Array.isArray(value.$values)) return value.$values;
  return [];
}

function normalizeTreeNode(raw: Record<string, unknown>): CategoryTreeItem | null {
  const id = Number(raw.categoryId ?? raw.CategoryId ?? raw.id ?? raw.Id ?? 0);
  if (!id) return null;

  const childrenRaw = extractValues(
    (raw.children ?? raw.Children) as CategoryTreeItem[] | { $values?: Record<string, unknown>[] }
  );

  return {
    id,
    name: String(raw.name ?? raw.Name ?? raw.categoryName ?? raw.CategoryName ?? '').trim(),
    description: String(raw.description ?? raw.Description ?? '').trim(),
    imageUrl: String(raw.imageUrl ?? raw.ImageUrl ?? '').trim() || undefined,
    courseCount: Number(raw.courseCount ?? raw.CourseCount ?? 0),
    createdAt: String(raw.createAt ?? raw.CreateAt ?? ''),
    children: childrenRaw
      .map((child) => normalizeTreeNode(child as Record<string, unknown>))
      .filter((child): child is CategoryTreeItem => child != null),
  };
}

export function flattenCategoryTree(tree: CategoryTreeItem[]): CategoryListItem[] {
  const out: CategoryListItem[] = [];

  const walk = (nodes: CategoryTreeItem[]) => {
    for (const node of nodes) {
      out.push({
        id: node.id,
        categoryName: node.name,
        description: node.description,
      });
      if (node.children.length > 0) walk(node.children);
    }
  };

  walk(tree);
  return out;
}

export function findCategoryInTree(tree: CategoryTreeItem[], id: number): CategoryTreeItem | null {
  for (const node of tree) {
    if (node.id === id) return node;
    const found = findCategoryInTree(node.children, id);
    if (found) return found;
  }
  return null;
}

export function getCategoryAncestry(tree: CategoryTreeItem[], targetId: number): CategoryTreeItem[] {
  const path: CategoryTreeItem[] = [];

  const walk = (nodes: CategoryTreeItem[]): boolean => {
    for (const node of nodes) {
      path.push(node);
      if (node.id === targetId) return true;
      if (walk(node.children)) return true;
      path.pop();
    }
    return false;
  };

  walk(tree);
  return path;
}

export function getCategoryChildren(tree: CategoryTreeItem[], parentId: number | null): CategoryTreeItem[] {
  if (parentId == null) return tree;
  return findCategoryInTree(tree, parentId)?.children ?? [];
}

export function buildCategoryBreadcrumb(
  tree: CategoryTreeItem[],
  parentId: number | null
): { id: number | null; name: string }[] {
  const trail: { id: number | null; name: string }[] = [{ id: null, name: '' }];

  if (parentId == null) return trail;

  const path: CategoryTreeItem[] = [];

  const findPath = (nodes: CategoryTreeItem[], targetId: number): boolean => {
    for (const node of nodes) {
      path.push(node);
      if (node.id === targetId) return true;
      if (findPath(node.children, targetId)) return true;
      path.pop();
    }
    return false;
  };

  findPath(tree, parentId);

  for (const node of path) {
    trail.push({ id: node.id, name: node.name });
  }

  return trail;
}

export function buildCategoryPickerOptions(
  tree: CategoryTreeItem[],
  rootLabel: string
): { id: number | null; name: string; depth: number }[] {
  const out: { id: number | null; name: string; depth: number }[] = [
    { id: null, name: rootLabel, depth: 0 },
  ];

  const walk = (nodes: CategoryTreeItem[], depth: number) => {
    for (const node of nodes) {
      out.push({ id: node.id, name: node.name, depth });
      if (node.children.length > 0) walk(node.children, depth + 1);
    }
  };

  walk(tree, 0);
  return out;
}

export type CategoryFlatRow = {
  node: CategoryTreeItem;
  depth: number;
  hasChildren: boolean;
};

export function flattenVisibleCategoryRows(
  nodes: CategoryTreeItem[],
  collapsedIds: Set<number>,
  depth = 0
): CategoryFlatRow[] {
  const out: CategoryFlatRow[] = [];

  for (const node of nodes) {
    const hasChildren = node.children.length > 0;
    out.push({ node, depth, hasChildren });
    if (hasChildren && !collapsedIds.has(node.id)) {
      out.push(...flattenVisibleCategoryRows(node.children, collapsedIds, depth + 1));
    }
  }

  return out;
}

export function flattenAllCategoryRows(
  nodes: CategoryTreeItem[],
  depth = 0
): CategoryFlatRow[] {
  const out: CategoryFlatRow[] = [];

  for (const node of nodes) {
    const hasChildren = node.children.length > 0;
    out.push({ node, depth, hasChildren });
    if (hasChildren) out.push(...flattenAllCategoryRows(node.children, depth + 1));
  }

  return out;
}

export function collectCategoryIds(tree: CategoryTreeItem[]): number[] {
  const ids: number[] = [];
  const walk = (nodes: CategoryTreeItem[]) => {
    for (const node of nodes) {
      if (node.children.length > 0) ids.push(node.id);
      walk(node.children);
    }
  };
  walk(tree);
  return ids;
}

export function collectDescendantIds(node: CategoryTreeItem): number[] {
  const ids: number[] = [];
  const walk = (current: CategoryTreeItem) => {
    for (const child of current.children) {
      ids.push(child.id);
      walk(child);
    }
  };
  walk(node);
  return ids;
}

export function countCategoryDescendants(node: CategoryTreeItem): number {
  return collectDescendantIds(node).length;
}

export type UpdateCategoryParams = {
  categoryId: number;
  categoryName: string;
  description: string;
  categoryImage?: File | null;
};

export async function updateCategory(params: UpdateCategoryParams): Promise<{ ok: boolean; message?: string }> {
  const formData = new FormData();
  formData.append('CategoryId', String(params.categoryId));
  formData.append('CategoryName', params.categoryName.trim());
  formData.append('Description', params.description.trim());
  if (params.categoryImage && params.categoryImage.size > 0) {
    formData.append('CategoryImage', params.categoryImage);
  }

  try {
    await apiRequest<string>(`${BASE}/update-category`, { method: 'POST', body: formData });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update category';
    return { ok: false, message };
  }
}

export async function deleteCategory(categoryId: number): Promise<{ ok: boolean; message?: string }> {
  try {
    await apiRequest<string>(`${BASE}/Delete${buildQuery({ categoryId })}`, { method: 'DELETE' });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete category';
    return { ok: false, message };
  }
}

export async function searchCategoryTree(params?: {
  categoryName?: string;
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<CategoryTreeItem[]> {
  const { categoryName, inputValue, pageNumber = 1, pageSize = 500 } = params ?? {};
  const path = `${BASE}/SearchCategories${buildQuery({
    categoryName: categoryName ?? inputValue ?? '',
    pageNumber,
    pageSize,
    needTotalCount: false,
  })}`;
  const raw = await apiRequest<PagedResponseRaw<Record<string, unknown>>>(path);
  const page = normalizePagedResponse(raw);
  return page.queryResult
    .map((row) => normalizeTreeNode(row as Record<string, unknown>))
    .filter((row): row is CategoryTreeItem => row != null);
}

export async function searchCategories(params?: {
  inputValue?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<CategoryListItem[]> {
  const tree = await searchCategoryTree(params);
  return flattenCategoryTree(tree);
}

export async function addCategory(params: AddCategoryParams): Promise<{ ok: boolean; message?: string }> {
  const formData = new FormData();
  formData.append('CategoryName', params.categoryName.trim());
  formData.append('Description', params.description.trim());
  if (params.parentId != null && params.parentId > 0) {
    formData.append('ParentId', String(params.parentId));
  }
  if (params.categoryImage && params.categoryImage.size > 0) {
    formData.append('CategoryImage', params.categoryImage);
  }

  try {
    await apiRequest<string>(`${BASE}/add-category`, { method: 'POST', body: formData });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add category';
    return { ok: false, message };
  }
}
