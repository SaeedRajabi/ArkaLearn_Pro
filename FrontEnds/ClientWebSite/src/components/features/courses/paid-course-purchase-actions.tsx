'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { getMyCourses } from '@/lib/api/courses';
import { AddToBasketButton } from './add-to-basket-button';
import { BuyNowButton } from './buy-now-button';

type Props = {
  courseId: string | number;
  addToCartLabel: string;
  buyNowLabel: string;
  className?: string;
};

export function PaidCoursePurchaseActions({
  courseId,
  addToCartLabel,
  buyNowLabel,
  className,
}: Props) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checking, setChecking] = useState(false);

  const numericId = typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;

  useEffect(() => {
    if (!isAuthenticated || authLoading || Number.isNaN(numericId) || numericId <= 0) {
      setIsEnrolled(false);
      return;
    }

    let cancelled = false;
    setChecking(true);
    getMyCourses()
      .then((courses) => {
        if (!cancelled) {
          setIsEnrolled(courses.some((c) => String(c.id) === String(numericId)));
        }
      })
      .catch(() => {
        if (!cancelled) setIsEnrolled(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading, numericId]);

  if (checking) {
    return (
      <Button size="lg" variant="outline" className={className} disabled>
        …
      </Button>
    );
  }

  if (isEnrolled) {
    return (
      <div className={`space-y-2 text-center ${className ?? ''}`}>
        <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
          {isRtl ? 'شما قبلاً این دوره را خریداری کرده‌اید.' : 'You have already purchased this course.'}
        </p>
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link href="/account?view=my-courses">
            {isRtl ? 'مشاهده دوره‌های من' : 'View my courses'}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <AddToBasketButton courseId={courseId} label={addToCartLabel} className="w-full" />
      <BuyNowButton courseId={courseId} label={buyNowLabel} className="w-full" />
    </>
  );
}
