'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type DashboardBannerImageProps = {
  src: string;
  imageClassName?: string;
  bannerClassName?: string;
  withImageClass?: string;
  fallbackClass?: string;
  children?: React.ReactNode;
};

function DashboardBannerImageInner({
  src,
  imageClassName,
  bannerClassName,
  withImageClass,
  fallbackClass,
  children,
}: DashboardBannerImageProps) {
  return (
    <div
      className={cn(
        bannerClassName,
        src ? withImageClass : fallbackClass
      )}
    >
      {src ? (
        <img src={src} alt="" className={imageClassName} draggable={false} />
      ) : null}
      {children}
    </div>
  );
}

export const DashboardBannerImage = React.memo(DashboardBannerImageInner);
