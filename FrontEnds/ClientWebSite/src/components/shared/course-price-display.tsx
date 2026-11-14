'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  computeCourseDiscountPercent,
  formatCoursePriceToman,
} from '@/lib/utils/course-price';

type CoursePriceDisplayProps = {
  price: number;
  originalPrice?: number | null;
  discountPercentage?: number | null;
  lang?: 'en' | 'fa';
  freeLabel?: string;
  discountLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  showDiscountBadge?: boolean;
  className?: string;
};

function formatToman(amount: number, lang: 'en' | 'fa') {
  return formatCoursePriceToman(amount, lang);
}

function resolveDiscountPercent(
  price: number,
  originalPrice?: number | null,
  discountPercentage?: number | null
): number | undefined {
  if (discountPercentage && discountPercentage > 0) return discountPercentage;
  return computeCourseDiscountPercent(price, originalPrice);
}

export function CoursePriceDisplay({
  price,
  originalPrice,
  discountPercentage,
  lang = 'fa',
  freeLabel = 'رایگان',
  discountLabel = 'تخفیف',
  size = 'md',
  showDiscountBadge = false,
  className,
}: CoursePriceDisplayProps) {
  const isFree = price === 0;
  const hasDiscount = !isFree && originalPrice != null && originalPrice > price;
  const discount = resolveDiscountPercent(price, originalPrice, discountPercentage);

  const saleClass =
    size === 'lg'
      ? 'text-3xl font-extrabold text-primary'
      : size === 'sm'
        ? 'text-base font-bold text-primary'
        : 'text-lg font-extrabold text-primary';

  const originalClass =
    size === 'lg'
      ? 'text-lg font-medium text-muted-foreground line-through'
      : 'text-sm font-medium text-muted-foreground line-through';

  if (isFree) {
    return <span className={cn(saleClass, className)}>{freeLabel}</span>;
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className={saleClass}>{formatToman(price, lang)}</span>
        {hasDiscount && (
          <span className={originalClass}>{formatToman(originalPrice!, lang)}</span>
        )}
      </div>
      {showDiscountBadge && discount != null && discount > 0 && (
        <Badge variant="destructive" className="w-fit">
          {discount}% {discountLabel}
        </Badge>
      )}
    </div>
  );
}
