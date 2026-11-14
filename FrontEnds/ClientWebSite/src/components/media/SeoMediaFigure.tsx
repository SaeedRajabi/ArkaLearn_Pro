'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

type Props = {
  src: string;
  alt?: string | null;
  title?: string | null;
  caption?: string | null;
  description?: string | null;
  className?: string;
  imageClassName?: string;
  unoptimized?: boolean;
};

/** Accessible figure for SEO-friendly media on public pages. */
export function SeoMediaFigure({
  src,
  alt,
  title,
  caption,
  description,
  className,
  imageClassName,
  unoptimized = true,
}: Props) {
  const imgAlt = alt?.trim() || title?.trim() || 'Image';
  const imgTitle = title?.trim() || undefined;

  return (
    <figure className={cn('space-y-2', className)}>
      <div className="relative overflow-hidden rounded-lg">
        <Image
          src={src}
          alt={imgAlt}
          title={imgTitle}
          width={1200}
          height={630}
          className={cn('h-auto w-full object-cover', imageClassName)}
          unoptimized={unoptimized}
        />
      </div>
      {caption?.trim() ? (
        <figcaption className="text-center text-sm text-muted-foreground">{caption}</figcaption>
      ) : null}
      {description?.trim() && !caption?.trim() ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </figure>
  );
}
