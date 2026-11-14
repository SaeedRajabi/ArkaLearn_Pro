'use client';

import * as React from 'react';
import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryTreeItem } from '@/lib/api/categories';
import type { MegaMenuFeaturedMap } from '@/lib/header-mega-data';
import { CategoryTreePanel } from './category-tree-panel';
import { HeaderMenuPortal } from './header-menu-portal';
import { useHoverFlyout } from './use-hover-flyout';
import styles from './site-nav.module.css';

type Props = {
  lang: 'en' | 'fa';
  headerDic: Record<string, string | undefined>;
  categoryTree: CategoryTreeItem[];
  featuredByCategoryId?: MegaMenuFeaturedMap;
};

export function HeaderCategoriesMenu({
  lang,
  headerDic,
  categoryTree,
  featuredByCategoryId,
}: Props) {
  const isRtl = lang === 'fa';
  const categoriesLabel = headerDic.categories ?? (isRtl ? 'دسته‌بندی' : 'Categories');
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const { open, openFlyout, closeFlyout, toggleFlyout, setOpen } = useHoverFlyout();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  return (
    <div
      className={cn(styles.categoriesRoot, open && styles.categoriesRootOpen)}
      onMouseEnter={openFlyout}
      onMouseLeave={closeFlyout}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.categoriesTrigger}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={toggleFlyout}
      >
        <LayoutGrid className={styles.navIcon} aria-hidden />
        <span>{categoriesLabel}</span>
      </button>

      <HeaderMenuPortal
        open={open}
        anchorRef={triggerRef}
        align="start"
        isRtl={isRtl}
        placement="below"
        className={styles.categoriesPanelPortalWide}
        role="menu"
        onMouseEnter={openFlyout}
        onMouseLeave={closeFlyout}
      >
        <div className={styles.categoriesPanelSingle}>
          <p className={styles.categoriesColTitle}>
            {headerDic.browseCategories ?? (isRtl ? 'مرور دسته‌بندی‌ها' : 'Browse categories')}
          </p>
          <CategoryTreePanel
            tree={categoryTree}
            isRtl={isRtl}
            featuredByCategoryId={featuredByCategoryId}
            showFeatured
            emptyLabel={
              isRtl ? 'دسته‌بندی ثبت نشده است.' : 'No categories have been added yet.'
            }
            featuredTitle={headerDic.categoryFeatured ?? (isRtl ? 'پیشنهادهای برتر' : 'Top picks')}
          />
        </div>
      </HeaderMenuPortal>
    </div>
  );
}
