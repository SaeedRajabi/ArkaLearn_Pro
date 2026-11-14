'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, X } from 'lucide-react';
import { useBasketOptional } from '@/contexts/basket-context';
import { getCourseImageUrl } from '@/lib/utils/image-url';
import { cn } from '@/lib/utils';
import styles from './basket-header-item.module.css';

interface BasketHeaderItemProps {
  lang: 'en' | 'fa';
  className?: string;
}

export function BasketHeaderItem({ lang, className }: BasketHeaderItemProps) {
  const basket = useBasketOptional();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const isRtl = lang === 'fa';

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!basket) return null;

  const { items, totalCount, totalAmount, isLoading, removeCourse, finalAmount } = basket;

  const formatPrice = (price: number) => {
    if (price === 0) return isRtl ? 'رایگان' : 'Free';
    if (isRtl) return `${price.toLocaleString('fa-IR')} تومان`;
    return `$${price.toLocaleString('en-US')}`;
  };

  return (
    <div className={cn(styles.wrap, className)} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={isRtl ? 'سبد خرید' : 'Basket'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <ShoppingCart className="h-5 w-5" />
        {!isLoading && totalCount > 0 ? (
          <span className={styles.badge} style={isRtl ? { left: -4 } : { right: -4 }}>
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          className={cn(styles.panel, isRtl ? styles.panelRtl : styles.panelLtr)}
          role="dialog"
          aria-label={isRtl ? 'سبد خرید' : 'Shopping cart'}
        >
          <div className={styles.header}>
            <h2 className={styles.title}>{isRtl ? 'سبد خرید' : 'Shopping cart'}</h2>
            <span className={styles.countPill}>
              {isRtl
                ? `${totalCount.toLocaleString('fa-IR')} دوره`
                : `${totalCount} course${totalCount === 1 ? '' : 's'}`}
            </span>
          </div>

          {items.length === 0 ? (
            <p className={styles.empty}>
              {isRtl ? 'سبد خرید شما خالی است' : 'Your shopping cart is empty'}
            </p>
          ) : (
            <>
              <ul className={styles.list}>
                {items.map((item) => (
                  <li key={item.courseId} className={styles.item}>
                    <div className={styles.thumb}>
                      <Image
                        src={getCourseImageUrl(item.courseImage)}
                        alt={item.courseName}
                        fill
                        className="object-cover"
                        sizes="52px"
                      />
                    </div>
                    <div className={styles.meta}>
                      <p className={styles.itemTitle}>{item.courseName}</p>
                      <p className={styles.itemPrice}>
                        {formatPrice((item.checkoutPrice ?? item.price) * item.quantity)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      aria-label={isRtl ? 'حذف' : 'Remove'}
                      onClick={() => removeCourse(item.courseId)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className={styles.footer}>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>{isRtl ? 'جمع کل:' : 'Total:'}</span>
                  <span className={styles.totalValue}>{formatPrice(finalAmount || totalAmount)}</span>
                </div>
                <Link href="/checkout" className={styles.cta} onClick={() => setOpen(false)}>
                  {isRtl ? 'رفتن به سبد خرید' : 'Go to shopping cart'}
                </Link>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
