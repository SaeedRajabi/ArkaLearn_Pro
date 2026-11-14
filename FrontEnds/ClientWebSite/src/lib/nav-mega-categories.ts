import { getCategoryAncestry, type CategoryTreeItem } from '@/lib/api/categories';
import {
  buildCategoryBrowseUrl,
  type NavContentSectionId,
} from '@/lib/nav-content-sections';

export type MegaMenuCategoryUsage = Record<NavContentSectionId, number[]>;

export type MegaCategoryEntry = {
  leafId: number;
  leafName: string;
  ancestors: { id: number; name: string }[];
  href: string;
};

function comparePaths(a: MegaCategoryEntry, b: MegaCategoryEntry, locale: string): number {
  const pathA = [...a.ancestors.map((node) => node.name), a.leafName].join('\0');
  const pathB = [...b.ancestors.map((node) => node.name), b.leafName].join('\0');
  return pathA.localeCompare(pathB, locale, { sensitivity: 'base' });
}

export function collectDirectCourseCategoryIds(tree: CategoryTreeItem[]): number[] {
  const ids: number[] = [];

  const walk = (nodes: CategoryTreeItem[]) => {
    for (const node of nodes) {
      if (node.courseCount > 0) ids.push(node.id);
      if (node.children.length > 0) walk(node.children);
    }
  };

  walk(tree);
  return ids;
}

export function buildMegaCategoryEntries(
  section: NavContentSectionId,
  tree: CategoryTreeItem[],
  categoryIds: number[],
  options?: { maxItems?: number; locale?: string }
): MegaCategoryEntry[] {
  const maxItems = options?.maxItems ?? 8;
  const locale = options?.locale ?? 'fa';
  const uniqueIds = [...new Set(categoryIds.filter((id) => id > 0))];
  const entries: MegaCategoryEntry[] = [];

  for (const id of uniqueIds) {
    const path = getCategoryAncestry(tree, id);
    if (path.length === 0) continue;

    const leaf = path[path.length - 1];
    entries.push({
      leafId: leaf.id,
      leafName: leaf.name,
      ancestors: path.slice(0, -1).map((node) => ({ id: node.id, name: node.name })),
      href: buildCategoryBrowseUrl(section, leaf.id),
    });
  }

  entries.sort((a, b) => comparePaths(a, b, locale));
  return entries.slice(0, maxItems);
}

export function extractCategoryIdsFromItems(
  items: Array<{ categoryId?: number | null; CategoryId?: number | null }>
): number[] {
  const ids = new Set<number>();
  for (const item of items) {
    const id = item.categoryId ?? item.CategoryId;
    if (id != null && id > 0) ids.add(Number(id));
  }
  return [...ids];
}
