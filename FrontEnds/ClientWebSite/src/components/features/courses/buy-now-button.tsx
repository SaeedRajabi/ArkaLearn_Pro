'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useBasket } from '@/contexts/basket-context';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/hooks/use-toast';

interface BuyNowButtonProps {
  courseId: string | number;
  label: string;
  className?: string;
}

export function BuyNowButton({ courseId, label, className }: BuyNowButtonProps) {
  const { isAuthenticated } = useAuth();
  const { addCourse, isAdding } = useBasket();
  const { toast } = useToast();
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({
        title: isRtl ? 'نیاز به ورود' : 'Sign in required',
        description: isRtl
          ? 'برای خرید دوره، لطفاً وارد حساب کاربری خود شوید.'
          : 'Please sign in to purchase this course.',
      });
      router.push('/login?redirect=' + encodeURIComponent('/checkout'));
      return;
    }

    const id = typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;
    if (Number.isNaN(id) || id <= 0) {
      toast({
        title: isRtl ? 'خطا' : 'Error',
        description: isRtl ? 'شناسه دوره معتبر نیست.' : 'Invalid course id.',
        variant: 'destructive',
      });
      return;
    }

    const ok = await addCourse(id, 1);
    if (!ok) {
      toast({
        title: isRtl ? 'خطا' : 'Error',
        description: isRtl
          ? 'افزودن دوره به سبد خرید انجام نشد.'
          : 'Could not add the course to the cart.',
        variant: 'destructive',
      });
      return;
    }

    router.push('/checkout');
  };

  return (
    <Button size="lg" className={className} onClick={handleClick} disabled={isAdding}>
      {label}
    </Button>
  );
}
