'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import {
  redirectToPaymentGateway,
  requestCourseInstallmentPayment,
} from '@/lib/api/payments';
import { ApiError } from '@/lib/api/client';
import { Loader2 } from 'lucide-react';

export function CourseInstallmentPayClient() {
  const searchParams = useSearchParams();
  const { locale } = useLanguage();
  const isFa = locale === 'fa';
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startPayment() {
      const rawId = searchParams.get('installmentId');
      const installmentId = rawId ? Number(rawId) : NaN;
      if (!Number.isFinite(installmentId) || installmentId <= 0) {
        setError(
          isFa
            ? 'شناسه قسط معتبر نیست.'
            : 'Invalid installment id.'
        );
        return;
      }

      try {
        const payment = await requestCourseInstallmentPayment(installmentId);
        if (cancelled) return;
        if (!payment?.paymentUrl) {
          setError(
            isFa
              ? 'آدرس درگاه پرداخت دریافت نشد.'
              : 'Payment gateway URL was not returned.'
          );
          return;
        }
        redirectToPaymentGateway(payment.paymentUrl);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message
            : isFa
              ? 'خطا در شروع پرداخت قسط.'
              : 'Failed to start installment payment.';
        setError(message);
      }
    }

    void startPayment();
    return () => {
      cancelled = true;
    };
  }, [searchParams, isFa]);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-lg border p-6 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border p-8 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {isFa ? 'در حال انتقال به درگاه پرداخت…' : 'Redirecting to payment gateway…'}
      </p>
    </div>
  );
}
