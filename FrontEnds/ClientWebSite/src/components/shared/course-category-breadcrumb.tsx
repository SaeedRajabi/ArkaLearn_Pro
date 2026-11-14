import { ChevronLeft, ChevronRight, FolderOpen, Layers, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

export function normalizeCategoryPath(
  raw: string[] | { $values?: string[] } | null | undefined,
  fallbackName?: string | null
): string[] {
  if (Array.isArray(raw)) {
    const cleaned = raw.map((item) => String(item ?? '').trim()).filter(Boolean);
    if (cleaned.length > 0) return cleaned;
  }

  if (raw && typeof raw === 'object' && '$values' in raw && Array.isArray(raw.$values)) {
    const cleaned = raw.$values.map((item) => String(item ?? '').trim()).filter(Boolean);
    if (cleaned.length > 0) return cleaned;
  }

  const fallback = fallbackName?.trim();
  return fallback ? [fallback] : [];
}

type Props = {
  path?: string[] | null;
  fallbackName?: string | null;
  isRtl?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
};

export function CourseCategoryBreadcrumb({
  path,
  fallbackName,
  isRtl = false,
  size = 'sm',
  className,
}: Props) {
  const segments = normalizeCategoryPath(path ?? undefined, fallbackName);
  if (segments.length === 0) return null;

  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  const textClass = size === 'xs' ? 'text-[10px]' : size === 'md' ? 'text-sm' : 'text-xs';
  const iconClass = size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3';
  const padClass = size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5';

  return (
    <nav
      aria-label={isRtl ? 'مسیر دسته‌بندی' : 'Category path'}
      className={cn('flex flex-wrap items-center gap-1', className, isRtl && 'flex-row-reverse justify-end')}
    >
      {segments.map((name, index) => {
        const isRoot = index === 0;
        const isLeaf = index === segments.length - 1;
        const Icon = isRoot ? FolderOpen : isLeaf ? Tag : Layers;

        return (
          <span key={`${name}-${index}`} className={cn('inline-flex items-center gap-1', isRtl && 'flex-row-reverse')}>
            {index > 0 ? (
              <Chevron className={cn(iconClass, 'shrink-0 text-muted-foreground/50')} aria-hidden />
            ) : null}
            <span
              className={cn(
                'inline-flex max-w-[12rem] items-center gap-1 rounded-full font-medium',
                padClass,
                textClass,
                isLeaf
                  ? 'bg-primary/12 text-primary ring-1 ring-primary/25'
                  : 'bg-muted/55 text-muted-foreground'
              )}
              title={name}
            >
              <Icon className={cn(iconClass, 'shrink-0')} aria-hidden />
              <span className="truncate">{name}</span>
            </span>
          </span>
        );
      })}
    </nav>
  );
}
