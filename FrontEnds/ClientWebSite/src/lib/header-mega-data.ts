import { cache } from 'react';
import { searchCategoryTree } from '@/lib/api/categories';
import {
  buildFeaturedByCategoryId,
  loadCategoryContentPools,
  type CategoryFeaturedItem,
} from '@/lib/category-browse';

export type MegaMenuFeaturedMap = Record<number, CategoryFeaturedItem[]>;

/** Top featured items per category for mega menu panels */
export const getMegaMenuFeaturedMap = cache(async (): Promise<MegaMenuFeaturedMap> => {
  let tree: Awaited<ReturnType<typeof searchCategoryTree>> = [];
  try {
    tree = await searchCategoryTree({ pageSize: 500 });
  } catch {
    return {};
  }

  if (tree.length === 0) return {};

  const pools = await loadCategoryContentPools();
  return buildFeaturedByCategoryId(tree, pools, 4);
});
