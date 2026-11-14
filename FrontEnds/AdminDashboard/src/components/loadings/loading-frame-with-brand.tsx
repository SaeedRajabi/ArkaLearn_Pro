import React from 'react';
import { BrandLogo } from '@/components/brand-logo';

function LoadingFrameWithBrand({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-transparent">
      <div className="flex animate-pulse flex-col items-center gap-4">
        <BrandLogo showWordmark={false} />
        <span className="text-2xl font-semibold text-primary">{title}</span>
      </div>
    </div>
  );
}

export default LoadingFrameWithBrand;
