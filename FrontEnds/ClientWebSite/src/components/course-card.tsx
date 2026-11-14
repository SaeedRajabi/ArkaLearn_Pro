'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CourseListItem, Dictionary } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useFavorites } from '@/contexts/favorites-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { AddToBasketButton } from '@/components/features/courses/add-to-basket-button';
import { CourseCategoryBreadcrumb } from '@/components/shared/course-category-breadcrumb';
import { RemoteImage } from '@/components/shared/remote-image';
import { getCourseImageUrl } from '@/lib/utils/image-url';
import { getCourseUrl } from '@/lib/course-slug';
import { CoursePriceDisplay } from '@/components/shared/course-price-display';

function courseLevelToKey(level?: string): 'introductory' | 'intermediate' | 'advanced' {
  if (!level) return 'introductory';
  const l = level.toLowerCase();
  if (l.includes('adv') || l.includes('پیشرفته')) return 'advanced';
  if (l.includes('inter') || l.includes('میان')) return 'intermediate';
  return 'introductory';
}

interface CourseCardProps {
  course: CourseListItem;
  dict: Dictionary;
  /** Slightly denser card for store grid beside filters. */
  compact?: boolean;
}

export function CourseCard({ course, dict, compact = false }: CourseCardProps) {
  const [isBusy, setIsBusy] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const price = course.price ?? 0;
  const lang = dict.header.courses === 'Courses' ? 'en' : 'fa';
  const isRtl = lang === 'fa';
  const levelKey = courseLevelToKey(course.courseLevel);
  const courseUrl = getCourseUrl({ id: course.id, slug: course.slug, title: course.title });
  const favorited = isFavorite(course.id);
  const ratingValue =
    course.rating != null && course.rating > 0 ? Number(course.rating).toFixed(1) : null;

  const handleFavoriteClick = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({
        title: 'نیاز به ورود',
        description: 'برای افزودن دوره به علاقه‌مندی‌ها، لطفا وارد حساب کاربری شوید.',
      });
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (isBusy) return;
    setIsBusy(true);
    const ok = await toggleFavorite(course.id);
    if (!ok) {
      toast({
        title: 'خطا',
        description: 'امکان به‌روزرسانی علاقه‌مندی‌ها وجود ندارد. دوباره تلاش کنید.',
        variant: 'destructive',
      });
    }
    setIsBusy(false);
  };

  return (
    <motion.div 
      whileHover={{ y: compact ? -4 : -8 }} 
      transition={{ type: 'spring', stiffness: 300 }}
      className="h-full"
    >
      <Card 
        className={cn(
          'flex h-full flex-col overflow-hidden shadow-sm transition-shadow duration-300 hover:shadow-xl',
          compact && 'text-[0.95rem]'
        )}
      >
        <CardHeader className="p-0">
          <div className={cn('relative', compact ? 'aspect-[16/10]' : 'aspect-video')}>
            <RemoteImage
              src={getCourseImageUrl(course.titleImage)}
              alt={course.title}
              fill
              className="object-cover"
              data-ai-hint={course.title}
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm">
                {dict.levels[levelKey]}
              </Badge>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute top-2 left-2 rounded-full bg-white/50 text-foreground hover:bg-white/80 hover:text-rose-500 backdrop-blur-sm"
              onClick={handleFavoriteClick}
              disabled={isBusy}
            >
              <Heart className={cn("h-5 w-5", favorited && "fill-rose-500 text-rose-500")} />
              <span className="sr-only">Add to favorites</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className={cn('flex-grow', compact ? 'p-3' : 'p-4')}>
          <CourseCategoryBreadcrumb
            path={course.categoryPath}
            fallbackName={course.categoryName}
            isRtl={isRtl}
            size="xs"
            className="mb-2"
          />
          <CardTitle className={cn(
            'mb-2 font-bold leading-tight line-clamp-2 font-headline',
            compact ? 'h-12 text-base' : 'h-14 text-lg'
          )}>
              <Link href={courseUrl} className="hover:text-primary transition-colors">
                  {course.title}
              </Link>
          </CardTitle>
          {course.shortDescription && (
            <p className={cn('text-muted-foreground line-clamp-2', compact ? 'text-xs' : 'text-sm')}>
              {course.shortDescription}
            </p>
          )}
          <div className={cn('mt-2 flex items-center gap-2', compact ? 'text-xs' : 'text-sm')}>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span>{ratingValue ?? '—'}</span>
            </div>
            <span className="text-muted-foreground">({course.studentCount} {lang === 'en' ? 'reviews' : 'نظر'})</span>
          </div>
        </CardContent>
        <CardFooter className={cn('flex flex-wrap items-center justify-between gap-3 pt-0', compact ? 'p-3' : 'p-4')}>
          <CoursePriceDisplay
            price={price}
            originalPrice={course.originalPrice}
            lang={lang}
            freeLabel={dict.home.free}
            size={compact ? 'sm' : 'md'}
          />
          <div className="flex items-center gap-2">
            <AddToBasketButton
              courseId={course.id}
              label={dict.coursesPage?.addToCart ?? (lang === 'en' ? 'Add to cart' : 'افزودن به سبد')}
              size="sm"
            />
            <Link href={courseUrl} className="text-sm font-semibold text-primary hover:underline">
              {lang === 'en' ? 'View Details' : 'مشاهده جزئیات'}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
