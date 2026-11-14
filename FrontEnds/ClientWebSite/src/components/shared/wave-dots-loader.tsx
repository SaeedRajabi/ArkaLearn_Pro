'use client';

import { cn } from '@/lib/utils';

export type WaveDotsPhase = 'loading' | 'complete';

interface WaveDotsLoaderProps {
  phase: WaveDotsPhase;
  className?: string;
  dotCount?: number;
}

export function WaveDotsLoader({ phase, className, dotCount = 5 }: WaveDotsLoaderProps) {
  return (
    <div
      className={cn(
        'flex items-end justify-center gap-1.5',
        phase === 'complete' ? 'text-emerald-500' : 'text-red-500',
        'transition-colors duration-500 ease-out',
        className
      )}
      role="status"
      aria-label={phase === 'complete' ? 'Page ready' : 'Loading'}
    >
      {Array.from({ length: dotCount }).map((_, index) => (
        <span
          key={index}
          className="inline-block h-2.5 w-2.5 rounded-full bg-current shadow-sm"
          style={{
            animation: 'main-content-wave 0.9s ease-in-out infinite',
            animationDelay: `${index * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}
