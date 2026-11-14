'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { getMyCourses, registerFreeCourse } from '@/lib/api/courses';

interface RegisterFreeCourseButtonProps {
  courseId: string | number;
  label: string;
  className?: string;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
}

export function RegisterFreeCourseButton({
  courseId,
  label,
  className,
  size = 'lg',
  variant = 'default',
}: RegisterFreeCourseButtonProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);

  const numericId = typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;

  useEffect(() => {
    if (!isAuthenticated || authLoading || Number.isNaN(numericId) || numericId <= 0) {
      setIsEnrolled(false);
      return;
    }

    let cancelled = false;
    setCheckingEnrollment(true);
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
        if (!cancelled) setCheckingEnrollment(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading, numericId]);

  const handleClick = async () => {
    if (!isAuthenticated) {
      toast({
        title: isRtl ? 'ورود لازم است' : 'Sign in required',
        description: isRtl
          ? 'برای ثبت‌نام در دوره ابتدا وارد حساب کاربری شوید.'
          : 'Please sign in to enroll in this course.',
      });
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (Number.isNaN(numericId) || numericId <= 0) {
      toast({
        title: isRtl ? 'خطا' : 'Error',
        description: isRtl ? 'شناسه دوره نامعتبر است.' : 'Invalid course id.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const message = await registerFreeCourse(numericId);
      const lower = message.toLowerCase();
      const alreadyEnrolled = lower.includes('already enrolled');

      if (alreadyEnrolled) {
        setIsEnrolled(true);
        toast({
          title: isRtl ? 'ثبت‌نام قبلی' : 'Already enrolled',
          description: isRtl
            ? 'شما قبلاً در این دوره ثبت‌نام کرده‌اید.'
            : 'You have already enrolled in this course.',
        });
        return;
      }

      const isPending = lower.includes('awaiting') || lower.includes('approval');
      setIsEnrolled(true);
      toast({
        title: isPending
          ? (isRtl ? 'درخواست ثبت شد' : 'Registration submitted')
          : (isRtl ? 'ثبت‌نام موفق' : 'Enrolled successfully'),
        description: isPending
          ? (isRtl ? 'ثبت‌نام شما در انتظار تأیید است.' : 'Your registration is awaiting approval.')
          : (isRtl ? 'ثبت‌نام شما با موفقیت انجام شد.' : 'You have been enrolled successfully.'),
      });
      localStorage.setItem('purchaseCompleted', 'true');
      router.push('/account?view=my-courses');
    } catch {
      toast({
        title: isRtl ? 'خطا' : 'Error',
        description: isRtl ? 'ثبت‌نام انجام نشد. دوباره تلاش کنید.' : 'Enrollment failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingEnrollment) {
    return (
      <Button size={size} variant="outline" className={className} disabled>
        {isRtl ? '...' : '...'}
      </Button>
    );
  }

  if (isEnrolled) {
    return (
      <div className="space-y-2 w-full text-center">
        <p className="text-sm text-muted-foreground">
          {isRtl ? 'شما قبلاً در این دوره ثبت‌نام کرده‌اید.' : 'You have already enrolled in this course.'}
        </p>
        <Button asChild size={size} variant="outline" className={className}>
          <Link href="/account?view=my-courses">
            {isRtl ? 'مشاهده دوره‌های من' : 'View my courses'}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <Button size={size} variant={variant} className={className} onClick={handleClick} disabled={isSubmitting}>
      {isSubmitting ? (isRtl ? 'در حال ثبت‌نام...' : 'Enrolling...') : label}
    </Button>
  );
}
