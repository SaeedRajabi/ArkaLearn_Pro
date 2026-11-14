'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  BRAND_FAVICON_PNG,
  BRAND_FAVICON_PATH,
  BRAND_ICON_192_PATH,
} from '@/lib/seo/brand';

const HEADER_ICON = BRAND_FAVICON_PATH;
const HEADER_ICON_FALLBACK = BRAND_FAVICON_PNG;

export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_ICON_192_PATH}
      alt=""
      width={36}
      height={36}
      className={cn('h-9 w-9 shrink-0 rounded-md object-contain', className)}
      aria-hidden
    />
  );
}

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  linked?: boolean;
  onClick?: () => void;
}

export function Logo({ className, showWordmark = true, linked = true, onClick }: LogoProps) {
  const [iconSrc, setIconSrc] = useState(HEADER_ICON);

  const content = (
    <div className={cn('flex items-center gap-2.5 text-foreground', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={iconSrc}
        alt="ArkaSoftware"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-md object-contain"
        onError={() => {
          if (iconSrc !== HEADER_ICON_FALLBACK) {
            setIconSrc(HEADER_ICON_FALLBACK);
          }
        }}
      />
      {showWordmark && (
        <span className="hidden text-lg font-bold tracking-tight sm:inline font-headline  hover:text-primary">
          ArkaSoftware
        </span>
      )}
    </div>
  );

  if (!linked) return content;

  return (
    <Link
      href="/"
      onClick={onClick}
      className="inline-flex transition-opacity hover:opacity-90"
      aria-label="ArkaSoftware home"
    >
      {content}
    </Link>
  );
}
