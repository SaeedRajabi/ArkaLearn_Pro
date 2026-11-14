'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BookMarked,
  BookOpen,
  ChevronDown,
  Download,
  FileText,
  Folder,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryTreeItem } from '@/lib/api/categories';
import {
  buildCategoryBrowseUrl,
  type CategoryFeaturedItem,
} from '@/lib/category-browse';
import styles from './site-nav.module.css';

type CategoryTreePanelProps = {
  tree: CategoryTreeItem[];
  isRtl: boolean;
  activeId?: number | null;
  onActiveChange?: (id: number) => void;
  featuredByCategoryId?: Record<number, CategoryFeaturedItem[]>;
  showFeatured?: boolean;
  emptyLabel: string;
  featuredTitle?: string;
  featuredEmptyLabel?: string;
  /** In mega menu the section title is shown outside — hide duplicate toolbar label */
  compactToolbar?: boolean;
};

function getDefaultExpandedIds(nodes: CategoryTreeItem[]): Set<number> {
  const first = nodes[0];
  if (first && first.children.length > 0) return new Set([first.id]);
  return new Set();
}

const KIND_LABELS_FA: Record<CategoryFeaturedItem['kind'], string> = {
  course: 'دوره',
  article: 'مقاله',
  book: 'کتاب',
  software: 'نرم‌افزار',
};

const KIND_LABELS_EN: Record<CategoryFeaturedItem['kind'], string> = {
  course: 'Course',
  article: 'Article',
  book: 'Book',
  software: 'Software',
};

const KIND_ICONS = {
  course: BookOpen,
  article: FileText,
  book: BookMarked,
  software: Download,
} as const;

function buildDefaultExpandedIds(tree: CategoryTreeItem[]): Set<number> {
  const firstRoot = tree[0];
  if (firstRoot?.children.length) {
    return new Set([firstRoot.id]);
  }
  return new Set();
}

function CategoryTreeBranch({
  node,
  depth,
  isRtl,
  expandedIds,
  onToggle,
  activeId,
  onActive,
}: {
  node: CategoryTreeItem;
  depth: number;
  isRtl: boolean;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  activeId: number | null;
  onActive: (id: number) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isActive = activeId === node.id;
  const FolderIcon = isExpanded ? FolderOpen : Folder;

  return (
    <li className={styles.categoryTreeItem}>
      <div
        className={cn(
          styles.categoryTreeRow,
          depth === 0 && styles.categoryTreeRowRoot,
          isActive && styles.categoryTreeRowActive
        )}
        style={{ paddingInlineStart: `${0.5 + depth * 1.05}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className={styles.categoryTreeToggle}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'بستن زیردسته‌ها' : 'باز کردن زیردسته‌ها'}
            onClick={() => onToggle(node.id)}
          >
            <ChevronDown
              className={cn(styles.categoryTreeToggleIcon, isExpanded && styles.categoryTreeToggleIconOpen)}
              aria-hidden
            />
          </button>
        ) : (
          <span className={styles.categoryTreeToggleSpacer} aria-hidden />
        )}

        <Link
          href={buildCategoryBrowseUrl(node.id)}
          className={cn(styles.categoryTreeLinkBtn, isActive && styles.categoryTreeLinkBtnActive)}
          onMouseEnter={() => onActive(node.id)}
          onFocus={() => onActive(node.id)}
        >
          <FolderIcon className={styles.categoryTreeFolderIcon} aria-hidden />
          <span className={styles.categoryTreeName}>{node.name}</span>
          {hasChildren ? (
            <span className={styles.categoryTreeChildCount}>{node.children.length}</span>
          ) : null}
        </Link>
      </div>

      {hasChildren && isExpanded ? (
        <ul className={styles.categoryTreeChildren}>
          {node.children.map((child) => (
            <CategoryTreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              isRtl={isRtl}
              expandedIds={expandedIds}
              onToggle={onToggle}
              activeId={activeId}
              onActive={onActive}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function CategoryTreePanel({
  tree,
  isRtl,
  activeId,
  onActiveChange,
  featuredByCategoryId,
  showFeatured = false,
  emptyLabel,
  featuredTitle,
  featuredEmptyLabel,
  compactToolbar = false,
}: CategoryTreePanelProps) {
  const [expandedIds, setExpandedIds] = React.useState<Set<number>>(() =>
    getDefaultExpandedIds(tree)
  );
  const [internalActiveId, setInternalActiveId] = React.useState<number | null>(
    tree[0]?.id ?? null
  );

  const resolvedActiveId = activeId ?? internalActiveId;
  const setActive = onActiveChange ?? setInternalActiveId;

  React.useEffect(() => {
    setExpandedIds(getDefaultExpandedIds(tree));
    if (tree[0]) setActive(tree[0].id);
  }, [tree, setActive]);

  const toggleExpand = React.useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = React.useCallback(() => {
    const ids = new Set<number>();
    const walk = (nodes: CategoryTreeItem[]) => {
      for (const node of nodes) {
        if (node.children.length > 0) ids.add(node.id);
        walk(node.children);
      }
    };
    walk(tree);
    setExpandedIds(ids);
  }, [tree]);

  const collapseAll = React.useCallback(() => {
    setExpandedIds(getDefaultExpandedIds(tree));
  }, [tree]);

  const featured = resolvedActiveId ? featuredByCategoryId?.[resolvedActiveId] ?? [] : [];
  const kindLabels = isRtl ? KIND_LABELS_FA : KIND_LABELS_EN;
  const activeNode = resolvedActiveId
    ? (function find(nodes: CategoryTreeItem[]): CategoryTreeItem | null {
        for (const node of nodes) {
          if (node.id === resolvedActiveId) return node;
          const child = find(node.children);
          if (child) return child;
        }
        return null;
      })(tree)
    : null;

  if (tree.length === 0) {
    return <p className={styles.categoryTreeEmpty}>{emptyLabel}</p>;
  }

  return (
    <div className={cn(styles.categoryTreeLayout, showFeatured && styles.categoryTreeLayoutWithFeatured)}>
      <div className={styles.categoryTreeColumn}>
        <div
          className={cn(
            styles.categoryTreeToolbar,
            compactToolbar && styles.categoryTreeToolbarCompact
          )}
        >
          {!compactToolbar ? (
            <span className={styles.categoryTreeToolbarLabel}>
              {isRtl ? 'دسته‌بندی‌ها' : 'Categories'}
            </span>
          ) : (
            <span className={styles.categoryTreeToolbarSpacer} aria-hidden />
          )}
          <div className={styles.categoryTreeToolbarActions}>
            <button type="button" className={styles.categoryTreeToolbarBtn} onClick={expandAll}>
              {isRtl ? 'باز کردن همه' : 'Expand all'}
            </button>
            <button type="button" className={styles.categoryTreeToolbarBtn} onClick={collapseAll}>
              {isRtl ? 'بستن همه' : 'Collapse all'}
            </button>
          </div>
        </div>

        <div className={styles.categoryTreeScroll}>
          <ul className={styles.categoryTreeList}>
            {tree.map((node) => (
              <CategoryTreeBranch
                key={node.id}
                node={node}
                depth={0}
                isRtl={isRtl}
                expandedIds={expandedIds}
                onToggle={toggleExpand}
                activeId={resolvedActiveId}
                onActive={setActive}
              />
            ))}
          </ul>
        </div>
      </div>

      {showFeatured ? (
        <aside className={styles.categoryFeaturedPanel}>
          <div className={styles.categoryFeaturedHeader}>
            <div className={styles.categoryFeaturedHeaderIcon}>
              <Sparkles className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className={styles.categoryFeaturedTitle}>
                {featuredTitle ?? (isRtl ? 'برترین‌ها' : 'Top picks')}
              </p>
              {activeNode ? (
                <p className={styles.categoryFeaturedSubtitle}>{activeNode.name}</p>
              ) : null}
            </div>
          </div>

          {featured.length > 0 ? (
            <ul className={styles.categoryFeaturedList}>
              {featured.map((item, index) => {
                const Icon = KIND_ICONS[item.kind];
                return (
                  <li key={`${item.kind}-${item.id}`}>
                    <Link href={item.href} className={styles.categoryFeaturedCard}>
                      <span className={styles.categoryFeaturedRank}>{index + 1}</span>
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt="" className={styles.categoryFeaturedImage} />
                      ) : (
                        <div className={styles.categoryFeaturedImagePlaceholder} aria-hidden>
                          <Icon className="h-5 w-5" />
                        </div>
                      )}
                      <div className={styles.categoryFeaturedBody}>
                        <div className={styles.categoryFeaturedMetaRow}>
                          <span className={styles.categoryFeaturedKind}>{kindLabels[item.kind]}</span>
                          {item.badge ? (
                            <span className={styles.categoryFeaturedBadge}>{item.badge}</span>
                          ) : null}
                        </div>
                        <span className={styles.categoryFeaturedName}>{item.title}</span>
                        {item.subtitle ? (
                          <span className={styles.categoryFeaturedMeta}>{item.subtitle}</span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.categoryFeaturedEmptyBox}>
              <p className={styles.categoryFeaturedEmpty}>
                {featuredEmptyLabel ??
                  (isRtl
                    ? 'محتوایی برای این دسته ثبت نشده است.'
                    : 'No content in this category yet.')}
              </p>
            </div>
          )}
        </aside>
      ) : null}
    </div>
  );
}
