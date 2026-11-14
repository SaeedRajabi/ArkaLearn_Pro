'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type CoursesStoreToolbarDict = {
  storeTitle?: string;
  foundCount?: string;
  sortBy?: string;
  newest?: string;
  popular?: string;
  viewAsGrid?: string;
  viewAsList?: string;
  gridView?: string;
  listView?: string;
};

interface CoursesStoreToolbarProps {
  dict: CoursesStoreToolbarDict;
  filteredCount: number;
  sortOrder: 'newest' | 'popular';
  onSortChange: (value: 'newest' | 'popular') => void;
  layout: 'grid' | 'list';
  onLayoutChange: (value: 'grid' | 'list') => void;
  lang: 'en' | 'fa';
}

export function CoursesStoreToolbar({
  dict,
  filteredCount,
  sortOrder,
  onSortChange,
  layout,
  onLayoutChange,
  lang,
}: CoursesStoreToolbarProps) {
  const countLabel = (dict.foundCount ?? '{count}')
    .replace('{count}', filteredCount.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US'));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-foreground">{dict.storeTitle}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{countLabel}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={sortOrder} onValueChange={(v) => onSortChange(v as 'newest' | 'popular')}>
          <SelectTrigger className="h-10 w-[180px] rounded-xl border-border bg-card">
            <SelectValue placeholder={dict.sortBy} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">{dict.popular}</SelectItem>
            <SelectItem value="newest">{dict.newest}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex overflow-hidden rounded-xl border border-border bg-card">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn('gap-1.5 rounded-none px-3', layout === 'grid' && 'bg-muted')}
            onClick={() => onLayoutChange('grid')}
            aria-label={dict.viewAsGrid}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">{dict.gridView ?? dict.viewAsGrid}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn('gap-1.5 rounded-none px-3', layout === 'list' && 'bg-muted')}
            onClick={() => onLayoutChange('list')}
            aria-label={dict.viewAsList}
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">{dict.listView ?? dict.viewAsList}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
