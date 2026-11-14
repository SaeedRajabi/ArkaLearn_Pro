'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-8 w-8 shrink-0', className)}
      aria-hidden
    >
      <path
        d="M140 330 L256 140 L372 330"
        stroke="currentColor"
        strokeWidth="48"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface BrandLogoProps {
  className?: string;
  showWordmark?: boolean;
  wordmark?: string;
  linked?: boolean;
  href?: string;
  /** Sidebar header: white title + single brand icon on dark background */
  variant?: 'default' | 'sidebar';
}

export function BrandLogo({
  className,
  showWordmark = true,
  wordmark = 'ArkaSoftware',
  linked = false,
  href = '/dashboard',
  variant = 'default',
}: BrandLogoProps) {
  const isSidebar = variant === 'sidebar';

  const icon = (
    <Image
      src="/icons/icon.png"
      alt=""
      width={32}
      height={32}
      className={cn('h-8 w-8 shrink-0 rounded-md', isSidebar && 'group-data-[state=collapsed]:mx-auto')}
      unoptimized
    />
  );

  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      {icon}
      {showWordmark && (
        <span
          className={cn(
            'text-lg font-semibold tracking-tight group-data-[state=collapsed]:hidden',
            isSidebar ? 'text-white' : 'text-foreground'
          )}
        >
          {wordmark}
        </span>
      )}
    </div>
  );

  if (!linked) return content;

  return (
    <Link href={href} className="inline-flex transition-opacity hover:opacity-90">
      {content}
    </Link>
  );
}
