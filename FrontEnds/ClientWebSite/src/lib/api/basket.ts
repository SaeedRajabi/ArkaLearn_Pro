import { apiRequest } from './client';

const BASE = 'Basket';

export interface BasketItemQri {
  courseName: string;
  courseCategory: string;
  quantity: number;
  courseUnitPrice: number;
}

export async function addCourseToBasket(courseId: number, quantity: number = 1): Promise<string> {
  const result = await apiRequest<{ result?: string }>(`${BASE}/AddCourseToBasket`, {
    method: 'POST',
    body: { courseId, quantity },
  });
  return (result as { result?: string })?.result ?? 'OK';
}

export async function getMyBasket(): Promise<BasketItemQri[]> {
  const list = await apiRequest<BasketItemQri[]>(`${BASE}/GetMyBasket`);
  return Array.isArray(list) ? list : [];
}
