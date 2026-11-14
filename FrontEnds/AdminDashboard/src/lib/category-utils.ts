import type { Category } from '@/lib/types';

type RawCategory = Record<string, unknown>;

function readChildren(raw: RawCategory): RawCategory[] {
  const children = raw.children ?? raw.Children;
  if (Array.isArray(children)) return children as RawCategory[];
  if (children && typeof children === 'object' && Array.isArray((children as { $values?: RawCategory[] }).$values)) {
    return (children as { $values: RawCategory[] }).$values;
  }
  return [];
}

export function mapRawCategory(raw: RawCategory, depth = 0, parentId?: string | null): Category {
  const id = raw.categoryId ?? raw.CategoryId ?? raw.id ?? raw.Id;
  const name = String(raw.name ?? raw.Name ?? raw.categoryName ?? raw.CategoryName ?? '').trim();
  const desc = String(
    raw.description ?? raw.Description ?? raw.categoryDescription ?? raw.CategoryDescription ?? ''
  ).trim();
  const img = String(raw.imageUrl ?? raw.ImageUrl ?? raw.categoryImage ?? raw.CategoryImage ?? '').trim();
  const count = Number(raw.courseCount ?? raw.CourseCount ?? 0);
  const created = raw.createAt ?? raw.CreateAt ?? raw.createdAt ?? raw.CreatedAt;
  const parent = raw.parentId ?? raw.ParentId ?? parentId ?? null;
  const parentRaw = raw.parent ?? raw.Parent;
  let parentName = String(raw.parentName ?? raw.ParentName ?? '').trim();
  if (!parentName && parentRaw && typeof parentRaw === 'object') {
    const parentRecord = parentRaw as RawCategory;
    parentName = String(
      parentRecord.name ?? parentRecord.Name ?? parentRecord.categoryName ?? parentRecord.CategoryName ?? ''
    ).trim();
  }

  const childrenRaw = readChildren(raw);
  const children = childrenRaw.map((child) =>
    mapRawCategory(child, depth + 1, id != null ? String(id) : parentId ?? null)
  );

  return {
    categoryId: String(id ?? ''),
    categoryName: name,
    categoryDescription: desc,
    categoryImage: img || undefined,
    courseCount: count,
    createdAt: created ? new Date(String(created)) : new Date(),
    parentId: parent != null && String(parent) !== '0' ? String(parent) : null,
    parentName: parentName || undefined,
    children,
    depth,
  };
}

export function flattenCategories(tree: Category[]): Category[] {
  const out: Category[] = [];
  const walk = (nodes: Category[]) => {
    for (const node of nodes) {
      const { children, ...rest } = node;
      out.push(rest);
      if (children?.length) walk(children);
    }
  };
  walk(tree);
  return out;
}

export function flattenCategoriesForDisplay(tree: Category[]): Category[] {
  return flattenCategories(tree).map((item) => ({
    ...item,
    categoryName: `${item.depth && item.depth > 0 ? `${'— '.repeat(item.depth)}` : ''}${item.categoryName}`,
  }));
}

export function collectDescendantIds(tree: Category[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  const findNode = (nodes: Category[]): Category | null => {
    for (const node of nodes) {
      if (node.categoryId === rootId) return node;
      if (node.children?.length) {
        const found = findNode(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const walk = (node: Category | null) => {
    if (!node?.children?.length) return;
    for (const child of node.children) {
      ids.add(child.categoryId);
      walk(child);
    }
  };

  walk(findNode(tree));
  return ids;
}

export function buildParentOptions(
  tree: Category[],
  excludeIds: Set<string> = new Set()
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [
    { value: '0', label: '—' },
  ];

  const walk = (nodes: Category[]) => {
    for (const node of nodes) {
      if (!excludeIds.has(node.categoryId)) {
        const prefix = node.depth && node.depth > 0 ? `${'— '.repeat(node.depth)}` : '';
        options.push({ value: node.categoryId, label: `${prefix}${node.categoryName}` });
      }
      if (node.children?.length) walk(node.children);
    }
  };

  walk(tree);
  return options;
}
