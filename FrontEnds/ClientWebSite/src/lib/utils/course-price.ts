export function formatCoursePriceToman(amount: number, lang: 'en' | 'fa' = 'fa'): string {
  const formatted = amount.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');
  return lang === 'fa' ? `${formatted} تومان` : `${formatted} Toman`;
}

export function computeCourseDiscountPercent(
  price: number,
  originalPrice?: number | null
): number | undefined {
  if (!originalPrice || originalPrice <= price || price <= 0) return undefined;
  return Math.round((1 - price / originalPrice) * 100);
}
