import {apiRequest} from './client';
import {BasketItem} from '@/lib/utils/basket-storage';
import {CreateOrderFromBasketRequest} from "@/types";

const BASE = 'Order';

export interface CreateOrderResult {
  result: string; // Invoice ID
}

export interface OrderDetail {
  id: number;
  status: string;
  orderItems: {
   $id:string;
   $values:{
     courseId: number;
     courseTitle: string;
     unitPrice: number;
     quantity: number;
     totalPrice: number;
   }[]
  };
}

export async function createOrderFromBasket(items: BasketItem[], description?: string, discountCode?: string): Promise<string> {
  const payload:CreateOrderFromBasketRequest = {
    items: items.map(item => ({
      courseId: Number(item.courseId),
      quantity: Number(item.quantity),
      courseName: item.courseName,
      courseImage: item.courseImage,
      price: Number(item.checkoutPrice ?? item.price),
    })),
    description: description?.trim() || null,
    discountCode:null
  };

  if (discountCode) {
    payload.discountCode = discountCode;
  }

  return await apiRequest<string>(`${BASE}/CreateFromClientBasket`, {
    method: 'POST',
    body: payload,
  });
}

export async function getOrderById(orderId: number): Promise<OrderDetail | null> {
  try {
    return await apiRequest<OrderDetail>(`${BASE}/GetById?orderId=${orderId}`);
  } catch {
    return null;
  }
}

export { checkDiscountCode } from './discount-codes';
export type { ValidateDiscountResult } from './discount-codes';

