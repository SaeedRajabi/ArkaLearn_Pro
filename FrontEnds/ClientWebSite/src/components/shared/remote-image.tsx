'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type RemoteImageProps = Omit<ImageProps, 'onError' | 'src'> & {
  src: string;
};

/**
 * next/image with a local cover when the remote file fails (404 / broken).
 * Download host cannot customize IIS 404 pages — UI lives on the client.
 */
export function RemoteImage({
  src,
  alt,
  className,
  fill,
  width,
  height,
  ...rest
}: RemoteImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground',
          fill && 'absolute inset-0',
          className
        )}
        style={!fill && width && height ? { width, height } : undefined}
        role="img"
        aria-label={alt || 'تصویر یافت نشد'}
      >
        <ImageOff className="h-8 w-8 opacity-50" aria-hidden />
        <span className="px-2 text-center text-xs opacity-70">تصویر یافت نشد</span>
      </div>
    );
  }

  return (
    <Image
      {...rest}
      alt={alt}
      src={src}
      fill={fill}
      width={width}
      height={height}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
