'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { Dictionary } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RemoteImage } from '@/components/shared/remote-image';
import type { HomeCategorySliderItem } from '@/lib/home-category-slider';

type CourseCategorySliderProps = {
  dict: Dictionary;
  categories: HomeCategorySliderItem[];
};

export function CourseCategorySlider({ dict, categories }: CourseCategorySliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const isEnglish = dict.header.courses === 'Courses';

  const scrollByPage = (direction: 'prev' | 'next') => {
    const slider = sliderRef.current;
    if (!slider) return;

    const amount = Math.min(slider.clientWidth * 0.85, 720);
    const delta = direction === 'next' ? amount : -amount;
    // LTR track; RTL UI still scrolls visually with the same buttons.
    slider.scrollBy({
      left: isEnglish ? delta : -delta,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || categories.length <= 1) return;

    const interval = window.setInterval(() => {
      const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
      if (maxScrollLeft <= 8) return;

      if (slider.scrollLeft >= maxScrollLeft - 8) {
        slider.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }

      slider.scrollBy({ left: 220, behavior: 'smooth' });
    }, 3500);

    return () => window.clearInterval(interval);
  }, [categories.length]);

  if (categories.length === 0) return null;

  return (
    <section className="py-6 sm:py-8">
      <div className="container mx-auto px-4">
        <div className="relative rounded-3xl border bg-white/95 px-5 py-5 shadow-sm dark:bg-card/70 sm:px-8">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={isEnglish ? 'Previous categories' : 'دسته‌بندی‌های قبلی'}
            className={cn(
              'absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 rounded-full bg-background/90 shadow-lg backdrop-blur transition hover:bg-background sm:inline-flex',
              isEnglish ? 'left-3' : 'right-3'
            )}
            onClick={() => scrollByPage('prev')}
          >
            {isEnglish ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>

          <div
            ref={sliderRef}
            dir="ltr"
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 py-1 [scrollbar-width:none] sm:gap-6 sm:px-8 lg:gap-8 [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((category) => (
              <div
                key={category.id}
                className="min-w-[72%] snap-center sm:min-w-[240px] md:min-w-[220px] lg:min-w-[200px]"
              >
                <Link
                  href={category.href}
                  className="group flex h-16 items-center gap-3 rounded-xl border bg-background px-3 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/60">
                    <RemoteImage
                      src={category.image}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate" dir={isEnglish ? 'ltr' : 'rtl'}>
                    {category.label}
                  </span>
                </Link>
              </div>
            ))}
          </div>

          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={isEnglish ? 'Next categories' : 'دسته‌بندی‌های بعدی'}
            className={cn(
              'absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 rounded-full bg-background/90 shadow-lg backdrop-blur transition hover:bg-background sm:inline-flex',
              isEnglish ? 'right-3' : 'left-3'
            )}
            onClick={() => scrollByPage('next')}
          >
            {isEnglish ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </section>
  );
}
