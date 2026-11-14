'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useBasket } from '@/contexts/basket-context';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

interface AddToBasketButtonProps {
  courseId: string | number;
  label: string;
  className?: string;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
}

export function AddToBasketButton({ courseId, label, className, size = 'lg', variant = 'outline' }: AddToBasketButtonProps) {
  const { addCourse, isAdding } = useBasket();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [clicked, setClicked] = useState(false);

  const handleClick = async () => {
    // بررسی authentication
    if (!isAuthenticated) {
      toast({
        title: 'نیاز به ورود',
        description: 'برای افزودن دوره به سبد خرید، لطفاً وارد حساب کاربری خود شوید.',
        variant: 'default',
      });
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    const id = typeof courseId === 'string' ? parseInt(courseId, 10) : courseId;
    if (Number.isNaN(id) || id <= 0) {
      toast({ title: 'خطا', description: 'شناسه دوره نامعتبر است.', variant: 'destructive' });
      return;
    }
    
    setClicked(true);
    const ok = await addCourse(id, 1);
    if (ok) {
      toast({ title: 'افزوده شد', description: 'دوره به سبد خرید اضافه شد.' });
    } else {
      toast({
        title: 'خطا',
        description: 'افزودن به سبد خرید انجام نشد. دوباره تلاش کنید.',
        variant: 'destructive',
      });
    }
    setClicked(false);
  };

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={handleClick}
      disabled={isAdding || clicked}
    >
      {isAdding || clicked ? '...' : label}
    </Button>
  );
}
