/**
 * مدیریت سبد خرید در sessionStorage
 * Session بعد از 12 ساعت منقضی می‌شود
 */

export interface BasketItem {
  courseId: number;
  courseName: string;
  courseImage?: string;
  /** Full course price (cash total / installment schedule total). */
  price: number;
  /** Catalog original price before course-level discount (for strikethrough UI). */
  originalPrice?: number;
  /** Amount charged at checkout (first installment or cash price). */
  checkoutPrice?: number;
  paymentType?: 'cash' | 'installment';
  quantity: number;
  addedAt: number; // timestamp
  categoryId?: number;
  categoryName?: string;
  teacherName?: string;
  slug?: string;
  level?: string;
  durationLabel?: string;
  bestseller?: boolean;
  lifetimeAccess?: boolean;
}

export interface DiscountInfo {
  code: string;
  amount: number; // مبلغ تخفیف (تومان/ریال)
  percentage?: number; // درصد تخفیف (اختیاری)
}

export interface BasketData {
  items: BasketItem[];
  discount?: DiscountInfo;
}

const BASKET_STORAGE_KEY = 'basket_data'; // تغییر نام کلید برای جلوگیری از تداخل با نسخه قبلی
const BASKET_EXPIRY_KEY = 'basket_expiry';
const BASKET_EXPIRY_HOURS = 12;

/**
 * بررسی انقضای session
 */
function isBasketExpired(): boolean {
  if (typeof window === 'undefined') return true;
  
  const expiry = sessionStorage.getItem(BASKET_EXPIRY_KEY);
  if (!expiry) return true;
  
  const expiryTime = parseInt(expiry, 10);
  const now = Date.now();
  
  return now > expiryTime;
}

/**
 * تنظیم زمان انقضا
 */
function setBasketExpiry(): void {
  if (typeof window === 'undefined') return;
  
  const expiryTime = Date.now() + (BASKET_EXPIRY_HOURS * 60 * 60 * 1000);
  sessionStorage.setItem(BASKET_EXPIRY_KEY, expiryTime.toString());
}

/**
 * دریافت داده‌های سبد خرید
 */
export function getBasketData(): BasketData {
  if (typeof window === 'undefined') return { items: [] };
  
  if (isBasketExpired()) {
    clearBasket();
    return { items: [] };
  }
  
  try {
    const stored = sessionStorage.getItem(BASKET_STORAGE_KEY);
    if (!stored) {
        // پشتیبانی از نسخه قبلی (فقط آیتم‌ها)
        const oldItems = sessionStorage.getItem('basket_items');
        if (oldItems) {
            const items = JSON.parse(oldItems);
            return { items: Array.isArray(items) ? items : [] };
        }
        return { items: [] };
    }
    
    return JSON.parse(stored) as BasketData;
  } catch {
    return { items: [] };
  }
}

/**
 * ذخیره داده‌های سبد خرید
 */
export function saveBasketData(data: BasketData): void {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(data));
    setBasketExpiry();
  } catch (error) {
    console.error('Failed to save basket data:', error);
  }
}

/**
 * پاک کردن سبد خرید
 */
export function clearBasket(): void {
  if (typeof window === 'undefined') return;
  
  sessionStorage.removeItem(BASKET_STORAGE_KEY);
  sessionStorage.removeItem('basket_items'); // پاک کردن نسخه قدیمی
  sessionStorage.removeItem(BASKET_EXPIRY_KEY);
}

/**
 * افزودن دوره به سبد خرید
 */
export type AddCourseToBasketOptions = {
  checkoutPrice?: number;
  paymentType?: 'cash' | 'installment';
  originalPrice?: number;
  categoryId?: number;
  categoryName?: string;
  teacherName?: string;
  slug?: string;
  level?: string;
  durationLabel?: string;
  bestseller?: boolean;
  lifetimeAccess?: boolean;
};

export function addCourseToBasket(
  courseId: number,
  courseName: string,
  price: number,
  courseImage?: string,
  quantity: number = 1,
  options?: AddCourseToBasketOptions
): BasketItem[] {
  const data = getBasketData();
  const items = data.items;
  const checkoutPrice =
    options?.checkoutPrice != null && !Number.isNaN(Number(options.checkoutPrice))
      ? Number(options.checkoutPrice)
      : price;
  const paymentType = options?.paymentType === 'installment' ? 'installment' : 'cash';
  const meta = {
    originalPrice: options?.originalPrice,
    categoryId: options?.categoryId,
    categoryName: options?.categoryName,
    teacherName: options?.teacherName,
    slug: options?.slug,
    level: options?.level,
    durationLabel: options?.durationLabel,
    bestseller: options?.bestseller,
    lifetimeAccess: options?.lifetimeAccess ?? true,
  };
  
  // بررسی اینکه آیا دوره قبلاً در سبد است
  const existingIndex = items.findIndex(item => item.courseId === courseId);
  
  if (existingIndex >= 0) {
    // اگر وجود داشت، quantity را افزایش می‌دهیم
    items[existingIndex].quantity += quantity;
    items[existingIndex].price = price;
    items[existingIndex].checkoutPrice = checkoutPrice;
    items[existingIndex].paymentType = paymentType;
    items[existingIndex].courseImage = courseImage ?? items[existingIndex].courseImage;
    items[existingIndex].courseName = courseName || items[existingIndex].courseName;
    Object.assign(items[existingIndex], meta);
  } else {
    // اگر جدید است، اضافه می‌کنیم
    items.push({
      courseId,
      courseName,
      courseImage,
      price,
      checkoutPrice,
      paymentType,
      quantity,
      addedAt: Date.now(),
      ...meta,
    });
  }
  
  saveBasketData({ ...data, items });
  return items;
}

/** Sum of catalog prices (for “course discount” line vs checkout subtotal). */
export function getBasketCatalogAmount(items: BasketItem[]): number {
  return items.reduce((sum, item) => {
    const unit = item.originalPrice != null && item.originalPrice > item.price
      ? item.originalPrice
      : item.price;
    return sum + unit * item.quantity;
  }, 0);
}

/**
 * حذف دوره از سبد خرید
 */
export function removeCourseFromBasket(courseId: number): BasketItem[] {
  const data = getBasketData();
  const items = data.items.filter(item => item.courseId !== courseId);
  
  // اگر سبد خالی شد، تخفیف را هم پاک می‌کنیم
  const discount = items.length === 0 ? undefined : data.discount;
  
  saveBasketData({ items, discount });
  return items;
}

/**
 * به‌روزرسانی quantity یک دوره
 */
export function updateCourseQuantity(courseId: number, quantity: number): BasketItem[] {
  if (quantity <= 0) {
    return removeCourseFromBasket(courseId);
  }
  
  const data = getBasketData();
  const item = data.items.find(i => i.courseId === courseId);
  
  if (item) {
    item.quantity = quantity;
    saveBasketData(data);
  }
  
  return data.items;
}

/**
 * اعمال کد تخفیف
 */
export function applyDiscount(code: string, amount: number, percentage?: number): void {
    const data = getBasketData();
    data.discount = { code, amount, percentage };
    saveBasketData(data);
}

/**
 * حذف کد تخفیف
 */
export function removeDiscount(): void {
    const data = getBasketData();
    delete data.discount;
    saveBasketData(data);
}

/**
 * محاسبه مجموع تعداد آیتم‌ها
 */
export function getBasketTotalCount(items: BasketItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * محاسبه مجموع قیمت (بدون تخفیف) — از مبلغ checkout هر آیتم
 */
export function getBasketTotalAmount(items: BasketItem[]): number {
  return items.reduce((sum, item) => {
    const unit = item.checkoutPrice != null ? item.checkoutPrice : item.price;
    return sum + unit * item.quantity;
  }, 0);
}
