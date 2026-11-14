'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  BookOpen,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CategoryActionMenu } from '@/components/professor/categories/category-custom-menu';
import type { CategoryTreeItem } from '@/lib/api/categories';
import { getCategoryImageUrl } from '@/lib/category-image';
import { cn } from '@/lib/utils';

type Labels = {
  addSubcategory: string;
  edit: string;
  delete: string;
  rootCategory: string;
  childBadge: string;
  courses: string;
  subcategories: string;
};

type TreeViewProps = {
  tree: CategoryTreeItem[];
  isRtl: boolean;
  selectedId: number | null;
  collapsedIds: Set<number>;
  onToggleCollapse: (id: number) => void;
  onSelect: (id: number) => void;
  onAddChild?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  labels: Labels;
  readOnly?: boolean;
};

type SearchResultProps = {
  items: CategoryTreeItem[];
  ancestryMap: Map<number, CategoryTreeItem[]>;
  isRtl: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAddChild?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  labels: Labels;
  readOnly?: boolean;
};

type BlockSize = 'root' | 'md' | 'sm';

function getBlockSize(depth: number): BlockSize {
  if (depth === 0) return 'root';
  if (depth === 1) return 'md';
  return 'sm';
}

function getChildrenGridClass(depth: number): string {
  if (depth === 0) return 'mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4';
  return 'mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
}

function getChildrenWrapClass(depth: number, isRtl: boolean): string {
  const border = isRtl ? 'border-e-2 pe-2' : 'border-s-2 ps-2';
  const tone =
    depth === 0
      ? 'border-primary/20 bg-muted/25 rounded-lg p-2'
      : 'border-primary/15 bg-muted/20 rounded-md p-1.5';
  return cn('min-w-0', border, tone, isRtl ? 'me-0.5' : 'ms-0.5');
}

function countDescendants(node: CategoryTreeItem): number {
  let count = node.children.length;
  for (const child of node.children) count += countDescendants(child);
  return count;
}

type BranchProps = TreeViewProps & {
  node: CategoryTreeItem;
  depth: number;
};

type DeepTreeProps = Omit<TreeViewProps, 'tree'> & {
  node: CategoryTreeItem;
  depth: number;
};

function DeepCategoryTreeNode({
  node,
  depth,
  isRtl,
  selectedId,
  collapsedIds,
  onToggleCollapse,
  onSelect,
  labels,
}: DeepTreeProps) {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const treeLevel = Math.max(0, depth - 2);
  const indent = 8 + treeLevel * 18;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div role="treeitem" aria-expanded={hasChildren ? !isCollapsed : undefined} className="min-w-0">
      <div
        className={cn(
          'flex cursor-pointer items-center gap-2 rounded-md py-1.5 pe-2 transition-colors hover:bg-muted/60',
          isSelected && 'bg-primary/8 ring-1 ring-primary/20'
        )}
        style={{ paddingInlineStart: `${indent}px` }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={(e) => {
              stop(e);
              onToggleCollapse(node.id);
            }}
          >
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', isCollapsed && (isRtl ? 'rotate-90' : '-rotate-90'))}
            />
          </Button>
        ) : (
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-border" />
          </span>
        )}

        {hasChildren ? (
          isCollapsed ? (
            <Folder className="h-4 w-4 shrink-0 text-primary/80" />
          ) : (
            <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
          )
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}

        <span className={cn('min-w-0 flex-1 truncate text-sm font-medium', isRtl && 'text-right')}>
          {node.name}
        </span>

        <div className={cn('flex shrink-0 flex-wrap items-center gap-1.5', isRtl && 'flex-row-reverse')}>
          <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
            <BookOpen className="h-3 w-3" />
            {node.courseCount}
          </span>
          {hasChildren ? (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              <Layers className="me-0.5 h-2.5 w-2.5" />
              {node.children.length}
            </Badge>
          ) : null}
        </div>
      </div>

      {hasChildren && !isCollapsed ? (
        <div
          role="group"
          className={cn(
            'border-primary/12',
            isRtl ? 'me-3 border-e' : 'ms-3 border-s'
          )}
        >
          {node.children.map((child) => (
            <DeepCategoryTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isRtl={isRtl}
              selectedId={selectedId}
              collapsedIds={collapsedIds}
              onToggleCollapse={onToggleCollapse}
              onSelect={onSelect}
              labels={labels}
              readOnly
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DeepCategoryTreeList({
  nodes,
  depth,
  isRtl,
  selectedId,
  collapsedIds,
  onToggleCollapse,
  onSelect,
  labels,
}: {
  nodes: CategoryTreeItem[];
  depth: number;
  isRtl: boolean;
  selectedId: number | null;
  collapsedIds: Set<number>;
  onToggleCollapse: (id: number) => void;
  onSelect: (id: number) => void;
  labels: Labels;
}) {
  return (
    <div
      role="tree"
      aria-label="category subtree"
      className={cn(
        'mt-2 rounded-lg border border-primary/15 bg-muted/15 p-1.5',
        isRtl && 'text-right'
      )}
    >
      {nodes.map((child) => (
        <DeepCategoryTreeNode
          key={child.id}
          node={child}
          depth={depth}
          isRtl={isRtl}
          selectedId={selectedId}
          collapsedIds={collapsedIds}
          onToggleCollapse={onToggleCollapse}
          onSelect={onSelect}
          labels={labels}
          readOnly
        />
      ))}
    </div>
  );
}

function CategoryBlock({
  node,
  depth,
  isRtl,
  selectedId,
  collapsedIds,
  onToggleCollapse,
  onSelect,
  onAddChild,
  onEdit,
  onDelete,
  labels,
  readOnly = false,
}: BranchProps) {
  const size = getBlockSize(depth);
  const isSelected = selectedId === node.id;
  const isCollapsed = collapsedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const descendantCount = countDescendants(node);
  const imageSrc = getCategoryImageUrl(node.imageUrl);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const selectedRing = isSelected ? 'border-primary/50 ring-1 ring-primary/25' : 'border-border/80';

  const collapseBtn = size === 'root' ? 'h-7 w-7' : 'h-6 w-6';
  const chevronClass = 'h-3.5 w-3.5';

  const showActions = !readOnly && onAddChild && onEdit && onDelete;

  const block = (() => {
    if (size === 'root') {
      return (
        <article
          className={cn(
            'cursor-pointer rounded-xl border bg-card p-2.5 shadow-sm transition-all hover:border-primary/30 hover:shadow',
            selectedRing
          )}
          onClick={() => onSelect(node.id)}
        >
          <div className={cn('flex items-center gap-2.5', isRtl && 'flex-row-reverse')}>
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border bg-muted">
              <Image src={imageSrc} alt={node.name} fill className="object-cover" unoptimized />
            </div>
            <div className={cn('min-w-0 flex-1', isRtl && 'text-right')}>
              <div className={cn('flex flex-wrap items-center gap-1.5', isRtl && 'flex-row-reverse justify-end')}>
                <h3 className="truncate text-sm font-semibold">{node.name}</h3>
                <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                  <FolderOpen className="me-0.5 h-2.5 w-2.5" />
                  {labels.rootCategory}
                </Badge>
              </div>
              {node.description ? (
                <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{node.description}</p>
              ) : null}
              <div
                className={cn(
                  'mt-1 flex flex-wrap gap-2 text-[10px] text-muted-foreground',
                  isRtl && 'flex-row-reverse justify-end'
                )}
              >
                <span className="inline-flex items-center gap-0.5">
                  <BookOpen className="h-3 w-3" />
                  {node.courseCount}
                </span>
                {hasChildren ? (
                  <span className="inline-flex items-center gap-0.5">
                    <Layers className="h-3 w-3" />
                    {descendantCount}
                  </span>
                ) : null}
              </div>
            </div>
            <div className={cn('flex shrink-0 items-center gap-0.5', isRtl && 'flex-row-reverse')} onClick={stop}>
              {hasChildren ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={collapseBtn}
                  onClick={() => onToggleCollapse(node.id)}
                >
                  <ChevronDown className={cn(chevronClass, 'transition-transform', isCollapsed && '-rotate-90')} />
                </Button>
              ) : null}
              {showActions ? (
                <CategoryActionMenu
                  nodeId={node.id}
                  isRtl={isRtl}
                  labels={labels}
                  size={size}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ) : null}
            </div>
          </div>
        </article>
      );
    }

    return (
      <article
        className={cn(
          'group cursor-pointer overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow',
          selectedRing
        )}
        onClick={() => onSelect(node.id)}
      >
        <div className="relative h-14 overflow-hidden bg-muted">
          <Image
            src={imageSrc}
            alt={node.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <div className={cn('absolute bottom-1.5 start-1.5 end-8', isRtl && 'text-right')}>
            <h4 className="line-clamp-1 text-[11px] font-semibold text-white">{node.name}</h4>
          </div>
          {hasChildren ? (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className={cn(
                'absolute top-1 h-5 w-5 bg-black/35 text-white hover:bg-black/50',
                isRtl ? 'left-1' : 'right-1'
              )}
              onClick={(e) => {
                stop(e);
                onToggleCollapse(node.id);
              }}
            >
              <ChevronDown className={cn('h-3 w-3 transition-transform', isCollapsed && '-rotate-90')} />
            </Button>
          ) : null}
        </div>
        <div className={cn('flex items-center justify-between gap-1 p-1.5', isRtl && 'flex-row-reverse')}>
          <Badge variant="outline" className="h-4 px-1 text-[9px]">
            {node.courseCount} {labels.courses}
          </Badge>
          {showActions ? (
            <div onClick={stop}>
              <CategoryActionMenu
                nodeId={node.id}
                isRtl={isRtl}
                labels={labels}
                size={size}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ) : null}
        </div>
      </article>
    );
  })();

  return (
    <div className="min-w-0">
      {block}
      {hasChildren && !isCollapsed ? (
        depth >= 1 ? (
          <DeepCategoryTreeList
            nodes={node.children}
            depth={depth + 1}
            isRtl={isRtl}
            selectedId={selectedId}
            collapsedIds={collapsedIds}
            onToggleCollapse={onToggleCollapse}
            onSelect={onSelect}
            labels={labels}
          />
        ) : (
          <div className={getChildrenWrapClass(depth, isRtl)}>
            <div className={getChildrenGridClass(depth)}>
              {node.children.map((child) => (
                <CategoryBlock
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  tree={[]}
                  isRtl={isRtl}
                  selectedId={selectedId}
                  collapsedIds={collapsedIds}
                  onToggleCollapse={onToggleCollapse}
                  onSelect={onSelect}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  labels={labels}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}

export function ProfessorCategoryTreeView(props: TreeViewProps) {
  const { tree } = props;
  return (
    <div className="space-y-3">
      {tree.map((node) => (
        <CategoryBlock key={node.id} {...props} node={node} depth={0} />
      ))}
    </div>
  );
}

function SearchResultCard({
  node,
  path,
  isRtl,
  isSelected,
  labels,
  onSelect,
}: {
  node: CategoryTreeItem;
  path: CategoryTreeItem[];
  isRtl: boolean;
  isSelected: boolean;
  labels: Labels;
  onSelect: (id: number) => void;
}) {
  const imageSrc = getCategoryImageUrl(node.imageUrl);
  const isRoot = path.length <= 1;

  return (
    <article
      className={cn(
        'group flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow',
        isSelected && 'border-primary/50 ring-1 ring-primary/25'
      )}
      onClick={() => onSelect(node.id)}
    >
      <div className="relative h-20 overflow-hidden bg-muted">
        <Image
          src={imageSrc}
          alt={node.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className={cn('absolute bottom-2 start-2 end-2', isRtl && 'text-right')}>
          {path.length > 1 ? (
            <p className="mb-0.5 line-clamp-1 text-[9px] text-white/75">
              {path
                .slice(0, -1)
                .map((p) => p.name)
                .join(isRtl ? ' ‹ ' : ' › ')}
            </p>
          ) : null}
          <h3 className="line-clamp-2 text-xs font-semibold text-white">{node.name}</h3>
        </div>
      </div>

      <div className={cn('flex items-center justify-between gap-1 p-2', isRtl && 'flex-row-reverse')}>
        <div className={cn('flex flex-wrap gap-1', isRtl && 'flex-row-reverse')}>
          <Badge variant="secondary" className="h-4 px-1 text-[9px]">
            {isRoot ? labels.rootCategory : labels.childBadge}
          </Badge>
          <Badge variant="outline" className="h-4 px-1 text-[9px]">
            {node.courseCount}
          </Badge>
        </div>
      </div>
    </article>
  );
}

export function ProfessorCategorySearchGrid({
  items,
  ancestryMap,
  isRtl,
  selectedId,
  onSelect,
  labels,
}: SearchResultProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((node) => (
        <SearchResultCard
          key={node.id}
          node={node}
          path={ancestryMap.get(node.id) ?? [node]}
          isRtl={isRtl}
          isSelected={selectedId === node.id}
          labels={labels}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
