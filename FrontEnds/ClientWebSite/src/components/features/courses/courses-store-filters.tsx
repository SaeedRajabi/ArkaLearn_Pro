'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { CourseParentCategoryOption } from '@/components/features/courses/courses-store-hero';

type CoursesStoreFiltersDict = {
  filtersTitle?: string;
  clearAll?: string;
  categoriesTitle?: string;
  allCategories?: string;
  levelTitle?: string;
  maxPriceTitle?: string;
  freeLabel?: string;
  discountedOnly?: string;
};

interface CoursesStoreFiltersProps {
  dict: CoursesStoreFiltersDict;
  levelLabels: Record<string, string>;
  parentCategories: CourseParentCategoryOption[];
  selectedParentId: number | 'all';
  onSelectParent: (id: number | 'all') => void;
  availableLevels: string[];
  selectedLevels: string[];
  onToggleLevel: (level: string, checked: boolean) => void;
  maxPrice: number;
  priceCeiling: number;
  onMaxPriceChange: (value: number) => void;
  discountedOnly: boolean;
  onDiscountedOnlyChange: (value: boolean) => void;
  onClearAll: () => void;
  lang: 'en' | 'fa';
  className?: string;
}

function formatPriceLabel(value: number, lang: 'en' | 'fa', freeLabel: string): string {
  if (value <= 0) return freeLabel;
  const formatted = value.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');
  return lang === 'fa' ? `${formatted} تومان` : `${formatted} Toman`;
}

export function CoursesStoreFilters({
  dict,
  levelLabels,
  parentCategories,
  selectedParentId,
  onSelectParent,
  availableLevels,
  selectedLevels,
  onToggleLevel,
  maxPrice,
  priceCeiling,
  onMaxPriceChange,
  discountedOnly,
  onDiscountedOnlyChange,
  onClearAll,
  lang,
  className,
}: CoursesStoreFiltersProps) {
  const freeLabel = dict.freeLabel ?? (lang === 'fa' ? 'رایگان' : 'Free');
  const radioValue = selectedParentId === 'all' ? 'all' : String(selectedParentId);

  return (
    <aside
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.4)] dark:shadow-[0_12px_40px_-28px_rgba(0,0,0,0.55)]',
        className
      )}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-foreground">{dict.filtersTitle}</h2>
        <button
          type="button"
          onClick={onClearAll}
          className="text-sm font-medium text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
        >
          {dict.clearAll}
        </button>
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">{dict.categoriesTitle}</h3>
          <RadioGroup
            value={radioValue}
            onValueChange={(v) => onSelectParent(v === 'all' ? 'all' : Number(v))}
            className="space-y-2"
          >
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5 hover:bg-muted/50">
              <RadioGroupItem value="all" id="cat-all" />
              <span className="text-sm text-foreground">{dict.allCategories}</span>
            </label>
            {parentCategories.map((cat) => (
              <label
                key={cat.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5 hover:bg-muted/50"
              >
                <RadioGroupItem value={String(cat.id)} id={`cat-${cat.id}`} />
                <span className="text-sm text-foreground">{cat.name}</span>
              </label>
            ))}
          </RadioGroup>
        </section>

        {availableLevels.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{dict.levelTitle}</h3>
            <div className="space-y-2">
              {availableLevels.map((level) => {
                const checked = selectedLevels.includes(level);
                return (
                  <label
                    key={level}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => onToggleLevel(level, v === true)}
                    />
                    <span className="text-sm text-foreground">
                      {levelLabels[level] ?? level}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">{dict.maxPriceTitle}</h3>
            <span className="text-xs font-medium text-primary">
              {formatPriceLabel(maxPrice, lang, freeLabel)}
            </span>
          </div>
          <Slider
            min={0}
            max={Math.max(priceCeiling, 1)}
            step={Math.max(1, Math.round(priceCeiling / 100))}
            value={[maxPrice]}
            onValueChange={(vals) => onMaxPriceChange(vals[0] ?? priceCeiling)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{freeLabel}</span>
            <span>{formatPriceLabel(priceCeiling, lang, freeLabel)}</span>
          </div>
        </section>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3 py-3">
          <Label className="cursor-pointer text-sm font-medium text-foreground">
            {dict.discountedOnly}
          </Label>
          <Switch checked={discountedOnly} onCheckedChange={onDiscountedOnlyChange} />
        </label>
      </div>
    </aside>
  );
}
