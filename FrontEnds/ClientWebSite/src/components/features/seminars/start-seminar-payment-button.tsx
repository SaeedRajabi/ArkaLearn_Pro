'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';
import { paySeminarFromWallet } from '@/lib/api/wallet';
import { ApiError } from '@/lib/api/client';

interface StartSeminarPaymentButtonProps {
  seminarId: string | number;
  label: string;
  className?: string;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
}

export function StartSeminarPaymentButton({
  seminarId,
  label,
  className,
  size = 'lg',
  variant = 'default',
}: StartSeminarPaymentButtonProps) {
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
            ? 'برای پرداخت و ثبت‌نام در سمینار، لطفاً وارد حساب کاربری خود شوید.'
            : 'Please sign in to pay and register for this seminar.',
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
      await paySeminarFromWallet(id);
      toast({
        title: locale === 'fa' ? 'ثبت‌نام موفق' : 'Registration successful',
        description:
          locale === 'fa'
            ? 'سمینار از کیف پول شما پرداخت و ثبت‌نام انجام شد.'
            : 'Seminar paid from your wallet and registration completed.',
      });
      router.push('/account?view=my-seminars');
    } catch (error: unknown) {
      const message =
        error instanceof ApiError
          ? error.message
          : locale === 'fa'
            ? 'موجودی کیف پول کافی نیست یا پرداخت ناموفق بود. ابتدا کیف پول را شارژ کنید.'
            : 'Insufficient wallet balance or payment failed. Please top up your wallet first.';
      toast({
        title: locale === 'fa' ? 'خطا در پرداخت' : 'Payment error',
        description: message,
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
