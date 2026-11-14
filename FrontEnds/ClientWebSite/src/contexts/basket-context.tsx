'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { BasketItem, DiscountInfo } from '@/lib/utils/basket-storage';
import {
  getBasketData,
  saveBasketData,
  addCourseToBasket as addToStorage,
  removeCourseFromBasket as removeFromStorage,
  updateCourseQuantity as updateQuantityInStorage,
  applyDiscount as applyDiscountStorage,
  removeDiscount as removeDiscountStorage,
  getBasketTotalCount,
  getBasketTotalAmount,
  getBasketCatalogAmount,
  clearBasket,
} from '@/lib/utils/basket-storage';
import { getCourseById } from '@/lib/api/courses';

interface BasketContextValue {
  items: BasketItem[];
  discount?: DiscountInfo;
  totalCount: number;
  totalAmount: number;
  finalAmount: number;
  isLoading: boolean;
  isAdding: boolean;
  refresh: () => void;
  addCourse: (courseId: number, quantity?: number) => Promise<boolean>;
  removeCourse: (courseId: number) => void;
  updateQuantity: (courseId: number, quantity: number) => void;
  applyDiscount: (code: string, amount: number, percentage?: number) => void;
  /** Catalog list price sum (before course-level discounts). */
  catalogAmount: number;
  /** Course-level discounts (catalog − checkout subtotal). */
  courseDiscountAmount: number;
  removeDiscount: () => void;
  clear: () => void;
}

const BasketContext = createContext<BasketContextValue | null>(null);

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>([]);
  const [discount, setDiscount] = useState<DiscountInfo | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const refresh = useCallback(() => {
    const data = getBasketData();
    setItems(data.items);
    setDiscount(data.discount);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addCourse = useCallback(
    async (courseId: number, quantity: number = 1): Promise<boolean> => {
      if (isAdding) return false;
      setIsAdding(true);
      
      try {
        // دریافت اطلاعات دوره از API
        const course = await getCourseById(courseId);
        if (!course) {
          return false;
        }

        // افزودن به sessionStorage
        const firstInstallment =
          course.paymentType === 'installment' && course.installmentPlans?.length
            ? [...course.installmentPlans].sort((a, b) => a.installmentNumber - b.installmentNumber)[0]
                ?.amountToman
            : undefined;
        const checkoutPrice =
          course.checkoutPrice ??
          (firstInstallment != null ? Number(firstInstallment) : undefined) ??
          course.price;

        const updatedItems = addToStorage(
          courseId,
          course.title || 'Unknown Course',
          course.price,
          course.thumbnailUrl,
          quantity,
          {
            checkoutPrice: Number(checkoutPrice),
            paymentType: course.paymentType === 'installment' ? 'installment' : 'cash',
          }
        );

        setItems(updatedItems);
        return true;
      } catch (error) {
        console.error('Failed to add course to basket:', error);
        return false;
      } finally {
        setIsAdding(false);
      }
    },
    [isAdding]
  );

  const removeCourse = useCallback((courseId: number) => {
    const updatedItems = removeFromStorage(courseId);
    setItems(updatedItems);
    // اگر سبد خالی شد، تخفیف هم پاک می‌شود (توسط storage handler)
    if (updatedItems.length === 0) setDiscount(undefined);
  }, []);

  const updateQuantity = useCallback((courseId: number, quantity: number) => {
    const updatedItems = updateQuantityInStorage(courseId, quantity);
    setItems(updatedItems);
  }, []);

  const applyDiscount = useCallback((code: string, amount: number, percentage?: number) => {
    applyDiscountStorage(code, amount, percentage);
    setDiscount({ code, amount, percentage });
  }, []);

  const removeDiscount = useCallback(() => {
    removeDiscountStorage();
    setDiscount(undefined);
  }, []);

  const clear = useCallback(() => {
    clearBasket();
    setItems([]);
    setDiscount(undefined);
  }, []);

  const totalCount = getBasketTotalCount(items);
  const totalAmount = getBasketTotalAmount(items);
  const catalogAmount = getBasketCatalogAmount(items);
  const courseDiscountAmount = Math.max(0, catalogAmount - totalAmount);
  const finalAmount = Math.max(0, totalAmount - (discount?.amount || 0));

  const value: BasketContextValue = {
    items,
    discount,
    totalCount,
    totalAmount,
    catalogAmount,
    courseDiscountAmount,
    finalAmount,
    isLoading,
    isAdding,
    refresh,
    addCourse,
    removeCourse,
    updateQuantity,
    applyDiscount,
    removeDiscount,
    clear,
  };

  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>;
}

export function useBasket(): BasketContextValue {
  const ctx = useContext(BasketContext);
  if (!ctx) {
    throw new Error('useBasket must be used within BasketProvider');
  }
  return ctx;
}

export function useBasketOptional(): BasketContextValue | null {
  return useContext(BasketContext);
}
