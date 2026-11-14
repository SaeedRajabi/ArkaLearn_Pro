'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { GalleryImageTrigger, ImageLightbox } from '@/components/shared/image-lightbox';
import type { ProjectGalleryItem } from '@/types';

type ProjectGallerySectionProps = {
  gallery: ProjectGalleryItem[];
  projectTitle: string;
  pageDict: Record<string, string>;
  isRtl: boolean;
};

export function ProjectGallerySection({
  gallery,
  projectTitle,
  pageDict,
  isRtl,
}: ProjectGallerySectionProps) {
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const lightboxItems = gallery.map((item) => ({
    src: item.imageUrl,
    alt: item.title || projectTitle,
    title: item.title,
    description: item.shortDescription,
  }));

  if (gallery.length === 0) return null;

  return (
    <>
      <div className="min-w-0 max-w-full space-y-4 overflow-hidden rounded-2xl border bg-background p-3 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-headline text-lg font-bold sm:text-xl">{pageDict.gallery}</h2>
          <span className="text-sm text-muted-foreground">
            {gallery.length} {pageDict.galleryItems}
          </span>
        </div>

        <div dir="ltr" className="min-w-0 max-w-full overflow-hidden sm:hidden">
          <Carousel className="w-full max-w-full" opts={{ align: 'start', loop: gallery.length > 1 }}>
            <CarouselContent className="-ms-4">
              {gallery.map((item, index) => (
                <CarouselItem key={`${item.title}-${index}`} className="basis-full ps-4">
                  <div className="overflow-hidden rounded-xl border bg-muted/20">
                    <GalleryImageTrigger
                      src={item.imageUrl}
                      alt={item.title || projectTitle}
                      onOpen={() => openLightbox(index)}
                      className="aspect-video"
                    >
                      <div className="relative aspect-video">
                        <Image
                          src={item.imageUrl}
                          alt={item.title || projectTitle}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </GalleryImageTrigger>
                    {(item.title || item.shortDescription) && (
                      <div className="space-y-1 p-4">
                        {item.title && <p className="font-semibold">{item.title}</p>}
                        {item.shortDescription && (
                          <p className="text-sm text-muted-foreground">{item.shortDescription}</p>
                        )}
                      </div>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {gallery.length > 1 && (
              <>
                <CarouselPrevious className="start-2 top-[40%] -translate-y-1/2" />
                <CarouselNext className="end-2 top-[40%] -translate-y-1/2" />
              </>
            )}
          </Carousel>
        </div>

        <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((item, index) => (
            <div
              key={`grid-${item.title}-${index}`}
              className="overflow-hidden rounded-lg border bg-muted/10"
            >
              <GalleryImageTrigger
                src={item.imageUrl}
                alt={item.title || projectTitle}
                onOpen={() => openLightbox(index)}
                className="aspect-video"
              >
                <div className="relative aspect-video">
                  <Image
                    src={item.imageUrl}
                    alt={item.title || projectTitle}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </GalleryImageTrigger>
              {(item.title || item.shortDescription) && (
                <div className="space-y-1 p-3">
                  {item.title && <p className="text-sm font-semibold">{item.title}</p>}
                  {item.shortDescription && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{item.shortDescription}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <ImageLightbox
        items={lightboxItems}
        open={lightboxOpen}
        initialIndex={lightboxIndex}
        onOpenChange={setLightboxOpen}
        isRtl={isRtl}
        labels={{
          zoomIn: pageDict.galleryZoomIn ?? 'بزرگ‌نمایی',
          zoomOut: pageDict.galleryZoomOut ?? 'کوچک‌نمایی',
          resetZoom: pageDict.galleryResetZoom ?? 'بازنشانی زوم',
          previous: pageDict.galleryPrevious ?? 'تصویر قبلی',
          next: pageDict.galleryNext ?? 'تصویر بعدی',
          close: pageDict.galleryClose ?? 'بستن',
        }}
      />
    </>
  );
}
