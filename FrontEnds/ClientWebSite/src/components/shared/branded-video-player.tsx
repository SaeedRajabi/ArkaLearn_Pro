'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getBrandIconUrl } from '@/lib/seo/brand';

type Props = {
  children: React.ReactNode;
  className?: string;
  showBrand?: boolean;
  brandSize?: 'sm' | 'md' | 'lg';
};

const BRAND_SIZES = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
} as const;

export function BrandedVideoPlayer({
  children,
  className,
  showBrand = true,
  brandSize = 'md',
}: Props) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {children}
      {showBrand ? (
        <div
          className="pointer-events-none absolute bottom-3 end-3 z-10 rounded-md bg-black/40 p-1.5 shadow-sm backdrop-blur-[2px]"
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getBrandIconUrl('192')}
            alt=""
            className={cn('object-contain opacity-90', BRAND_SIZES[brandSize])}
          />
        </div>
      ) : null}
    </div>
  );
}
