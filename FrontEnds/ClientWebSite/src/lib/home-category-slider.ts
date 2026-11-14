import type { CategoryTreeItem } from '@/lib/api/categories';
import { buildCategoryBrowseUrl } from '@/lib/category-browse';
import { getCategoryImageUrl } from '@/lib/category-image';

export type HomeCategorySliderItem = {
  id: string;
  label: string;
  href: string;
  image: string;
};

function flattenCategoryTree(tree: CategoryTreeItem[]): CategoryTreeItem[] {
  const out: CategoryTreeItem[] = [];

  const walk = (nodes: CategoryTreeItem[]) => {
    for (const node of nodes) {
      out.push(node);
      if (node.children.length > 0) walk(node.children);
    }
  };

  walk(tree);
  return out;
}

function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Prefer root categories (program taxonomy). If too few, fill with unique
 * descendants that have courses — never duplicate by id or display name.
 */
function buildFromCategoryTree(tree: CategoryTreeItem[]): HomeCategorySliderItem[] {
  const seenIds = new Set<number>();
  const seenNames = new Set<string>();

  const takeUnique = (nodes: CategoryTreeItem[]): CategoryTreeItem[] => {
    const ranked = [...nodes]
      .filter((node) => node.name.trim().length > 0)
      .sort((a, b) => b.courseCount - a.courseCount || a.name.localeCompare(b.name, 'fa'));

    const unique: CategoryTreeItem[] = [];
    for (const node of ranked) {
      const key = normalizeCategoryName(node.name);
      if (!key || seenIds.has(node.id) || seenNames.has(key)) continue;
      seenIds.add(node.id);
      seenNames.add(key);
      unique.push(node);
    }
    return unique;
  };

  const roots = takeUnique(tree);
  let selected = roots;

  if (selected.length < 6) {
    const descendants = flattenCategoryTree(tree).filter((node) => {
      const isRoot = tree.some((root) => root.id === node.id);
      return !isRoot && (node.courseCount > 0 || node.children.length === 0);
    });
    selected = [...selected, ...takeUnique(descendants)];
  }

  return selected.slice(0, 14).map((node) => ({
    id: `category-${node.id}`,
    label: node.name.trim(),
    href: buildCategoryBrowseUrl(node.id),
    image: getCategoryImageUrl(node.imageUrl),
  }));
}

/** Landing-page category strip — only real program categories (with images when set). */
export function buildHomeCategorySliderItems(
  tree: CategoryTreeItem[],
  _lang?: 'en' | 'fa',
  _headerDic?: Record<string, string | undefined>
): HomeCategorySliderItem[] {
  return buildFromCategoryTree(tree);
}
