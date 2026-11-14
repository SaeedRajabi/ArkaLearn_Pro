'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { registerSeminar } from '@/lib/api/seminars';

interface RegisterSeminarButtonProps {
  seminarId: string | number;
  label: string;
  className?: string;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
}

export function RegisterSeminarButton({
  seminarId,
  label,
  className,
  size = 'lg',
  variant = 'default',
}: RegisterSeminarButtonProps) {
  const { isAuthenticated } = useAuth();
  const { locale } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = async () => {
    if (!isAuthenticated) {
      toast({
        title: locale === 'fa' ? 'نیاز به ورود' : 'Login required',
        description:
          locale === 'fa'
            ? 'برای ثبت‌نام در سمینار، لطفاً وارد حساب کاربری خود شوید.'
            : 'Please sign in to register for this seminar.',
        variant: 'default',
      });
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    const id = typeof seminarId === 'string' ? parseInt(seminarId, 10) : seminarId;
    if (Number.isNaN(id) || id <= 0) {
      toast({
        title: locale === 'fa' ? 'خطا' : 'Error',
        description: locale === 'fa' ? 'شناسه سمینار معتبر نیست.' : 'The seminar id is not valid.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await registerSeminar(id, true);
      toast({
        title: locale === 'fa' ? 'ثبت‌نام انجام شد' : 'Registration completed',
        description:
          locale === 'fa'
            ? 'سمینار به لیست سمینارهای شما اضافه شد.'
            : 'The seminar was added to your account.',
      });
      router.push('/account');
    } catch (err) {
      toast({
        title: locale === 'fa' ? 'خطا' : 'Error',
        description:
          locale === 'fa'
            ? 'ثبت‌نام انجام نشد. دوباره تلاش کنید.'
            : 'Registration failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button size={size} variant={variant} className={className} onClick={handleClick} disabled={isSubmitting}>
      {isSubmitting ? '...' : label}
    </Button>
  );
}
