'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Trash2, X, CheckCircle2, Star } from 'lucide-react';
import { useBasket } from '@/contexts/basket-context';
import { useAuth } from '@/contexts/auth-context';
import { createOrderFromBasket } from '@/lib/api/orders';
import { checkDiscountCode } from '@/lib/api/discount-codes';
import {
  getCartRecommendations,
  type CartRecommendationCourse,
} from '@/lib/api/cart-recommendations';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { getCourseImageUrl } from '@/lib/utils/image-url';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api/client';

interface CheckoutPageClientProps {
  dict: Record<string, unknown>;
}

type PageDict = Record<string, string>;

function t(dict: PageDict, key: string, fallback: string) {
  return dict[key] ?? fallback;
}

export function CheckoutPageClient({ dict }: CheckoutPageClientProps) {
  const {
    items,
    totalAmount,
    catalogAmount,
    courseDiscountAmount,
    finalAmount,
    discount,
    removeCourse,
    applyDiscount,
    removeDiscount,
    clear,
    addCourse,
    isAdding,
  } = useBasket();

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pathPercent, setPathPercent] = useState(0);
  const [suggestions, setSuggestions] = useState<CartRecommendationCourse[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const pageDict = (dict.checkoutPage ?? {}) as PageDict;
  const lang = (dict.header as { courses?: string } | undefined)?.courses === 'Courses' ? 'en' : 'fa';
  const isRtl = lang === 'fa';

  const formatPrice = (price: number) => {
    if (price === 0) return (dict.home as { free?: string } | undefined)?.free || (isRtl ? 'رایگان' : 'Free');
    if (isRtl) return `${price.toLocaleString('fa-IR')} تومان`;
    return `$${price.toLocaleString('en-US')}`;
  };

  const courseIdsKey = useMemo(() => items.map((i) => i.courseId).join(','), [items]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent('/checkout')}`);
    }
  }, [isAuthLoading, isAuthenticated, router]);

  useEffect(() => {
    let cancelled = false;
    const ids = courseIdsKey
      ? courseIdsKey.split(',').map(Number).filter((n) => n > 0)
      : [];

    if (ids.length === 0) {
      setSuggestions([]);
      setPathPercent(0);
      return;
    }

    setLoadingSuggestions(true);
    getCartRecommendations(ids)
      .then((res) => {
        if (cancelled) return;
        setSuggestions(res.suggestions.filter((s) => s.id > 0));
        setPathPercent(res.pathCompletionPercent);
      })
      .catch(() => {
        if (cancelled) return;
        setSuggestions([]);
        setPathPercent(Math.min(100, Math.round((ids.length / Math.max(ids.length, 3)) * 100)));
      })
      .finally(() => {
        if (!cancelled) setLoadingSuggestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseIdsKey]);

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;
    setIsCheckingDiscount(true);
    try {
      const result = await checkDiscountCode(discountInput, totalAmount, {
        courseIds: items.map((i) => i.courseId),
        lineTotals: items.map((i) => {
          const unit = i.checkoutPrice != null ? i.checkoutPrice : i.price;
          return unit * i.quantity;
        }),
      });
      applyDiscount(result.code, result.discountAmount, result.percentage ?? undefined);
      toast({
        title: t(pageDict, 'discountAppliedTitle', isRtl ? 'تخفیف اعمال شد' : 'Discount applied'),
        description: t(pageDict, 'discountAppliedDesc', isRtl
          ? `کد ${result.code} با موفقیت اعمال شد.`
          : `Code ${result.code} applied successfully.`),
      });
      setDiscountInput('');
    } catch (e: unknown) {
      toast({
        title: t(pageDict, 'discountErrorTitle', isRtl ? 'خطا' : 'Error'),
        description: getApiErrorMessage(e, isRtl ? 'کد تخفیف نامعتبر است.' : 'Invalid discount code.'),
        variant: 'destructive',
      });
    } finally {
      setIsCheckingDiscount(false);
    }
  };

  const handlePay = async () => {
    if (items.length === 0) {
      toast({
        title: t(pageDict, 'emptyCartTitle', isRtl ? 'سبد خرید خالی است' : 'Cart is empty'),
        variant: 'destructive',
      });
      return;
    }
    if (!agreeTerms) {
      toast({
        title: t(pageDict, 'termsRequired', isRtl ? 'پذیرش قوانین الزامی است' : 'Please accept the terms'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const invoiceId = await createOrderFromBasket(items, undefined, discount?.code);
      if (invoiceId) {
        toast({
          title: t(pageDict, 'orderSuccessTitle', isRtl ? 'سفارش ثبت شد' : 'Order created'),
          description:
            finalAmount === 0
              ? t(pageDict, 'orderSuccessFree', isRtl ? 'ثبت‌نام انجام شد.' : 'Enrollment completed.')
              : t(pageDict, 'orderSuccessPaid', isRtl ? 'در حال انتقال به فاکتور...' : 'Redirecting to invoice...'),
        });
        clear();
        router.push(`/invoices/${invoiceId}`);
      }
    } catch (error: unknown) {
      toast({
        title: t(pageDict, 'orderErrorTitle', isRtl ? 'خطا در ثبت سفارش' : 'Order failed'),
        description: getApiErrorMessage(error, isRtl ? 'مشکلی در ثبت سفارش پیش آمده است.' : 'Could not create order.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSuggestion = async (courseId: number) => {
    const ok = await addCourse(courseId, 1);
    toast({
      title: ok
        ? t(pageDict, 'addedToCart', isRtl ? 'به سبد اضافه شد' : 'Added to cart')
        : t(pageDict, 'addFailed', isRtl ? 'افزودن ناموفق بود' : 'Could not add course'),
      variant: ok ? 'default' : 'destructive',
    });
  };

  if (!mounted || isAuthLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const activeDiscountCount = discount ? 1 : 0;

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Hero summary */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.2)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)] lg:items-center">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              {t(pageDict, 'badge', isRtl ? 'مدیریت خرید دوره‌ها' : 'Course purchase management')}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {t(pageDict, 'cartTitle', isRtl ? 'سبد خرید شما' : 'Your shopping cart')}
            </h1>
            <p className="max-w-xl text-sm leading-7 text-slate-500">
              {t(
                pageDict,
                'cartSubtitle',
                isRtl
                  ? 'دوره‌های انتخابی را بررسی کنید، کد تخفیف بزنید و مسیر یادگیری‌تان را کامل‌تر کنید.'
                  : 'Review selected courses, apply a discount code, and complete your learning path.'
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <StatCard
              label={t(pageDict, 'statPath', isRtl ? 'تکمیل مسیر یادگیری' : 'Learning path completion')}
              value={`${pathPercent.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}٪`}
            />
            <StatCard
              label={t(pageDict, 'statDiscount', isRtl ? 'کد تخفیف فعال' : 'Active discount codes')}
              value={activeDiscountCount.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
            />
            <StatCard
              label={t(pageDict, 'statCourses', isRtl ? 'دوره در سبد' : 'Courses in cart')}
              value={items.length.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}
            />
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Trash2 className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {t(pageDict, 'emptyCartTitle', isRtl ? 'سبد خرید شما خالی است' : 'Your cart is empty')}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {t(
              pageDict,
              'emptyCartDesc',
              isRtl
                ? 'هنوز دوره‌ای اضافه نکرده‌اید. از فروشگاه دوره‌ها شروع کنید.'
                : 'You have not added any courses yet. Browse the course store to get started.'
            )}
          </p>
          <Button className="mt-6 rounded-xl" onClick={() => router.push('/courses')}>
            {t(pageDict, 'browseCourses', isRtl ? 'مشاهده دوره‌ها' : 'Browse courses')}
          </Button>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)]">
          <div className="space-y-6">
            {/* Selected courses */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {t(pageDict, 'selectedCourses', isRtl ? 'دوره‌های انتخاب شده' : 'Selected courses')}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {t(
                      pageDict,
                      'selectedCoursesDesc',
                      isRtl ? 'قبل از پرداخت، آیتم‌های سبد را نهایی کنید.' : 'Finalize your cart items before payment.'
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                  onClick={() => clear()}
                >
                  {t(pageDict, 'clearCart', isRtl ? 'پاک کردن سبد' : 'Clear cart')}
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item) => {
                  const unit = item.checkoutPrice ?? item.price;
                  const listPrice = item.originalPrice && item.originalPrice > unit ? item.originalPrice : item.price > unit ? item.price : null;
                  const discountPct =
                    listPrice && listPrice > unit
                      ? Math.round(((listPrice - unit) / listPrice) * 100)
                      : 0;

                  return (
                    <article
                      key={item.courseId}
                      className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-[96px_minmax(0,1fr)_auto]"
                    >
                      <div className="relative h-24 w-full overflow-hidden rounded-xl bg-slate-200 sm:h-24 sm:w-24">
                        <Image
                          src={getCourseImageUrl(item.courseImage)}
                          alt={item.courseName}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                      <div className="min-w-0 space-y-2">
                        {item.bestseller ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                            {t(pageDict, 'bestseller', isRtl ? 'پرفروش' : 'Bestseller')}
                          </span>
                        ) : null}
                        <h3 className="text-base font-bold leading-6 text-slate-900">{item.courseName}</h3>
                        <p className="text-xs text-slate-500">
                          {[item.teacherName, item.lifetimeAccess !== false ? (isRtl ? 'دسترسی مادام‌العمر' : 'Lifetime access') : null]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        <p className="text-xs text-slate-400">
                          {[item.durationLabel, item.level].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <div className="flex flex-row items-end justify-between gap-3 sm:flex-col sm:items-end">
                        <div className="text-end">
                          {listPrice ? (
                            <p className="text-xs text-slate-400 line-through">{formatPrice(listPrice)}</p>
                          ) : null}
                          {discountPct > 0 ? (
                            <span className="mb-1 inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                              {discountPct.toLocaleString(isRtl ? 'fa-IR' : 'en-US')}٪{' '}
                              {t(pageDict, 'off', isRtl ? 'تخفیف' : 'off')}
                            </span>
                          ) : null}
                          <p className="text-lg font-extrabold text-slate-900">{formatPrice(unit * item.quantity)}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-9 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => removeCourse(item.courseId)}
                        >
                          {t(pageDict, 'remove', isRtl ? 'حذف' : 'Remove')}
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Discount code */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-extrabold text-slate-900">
                {t(pageDict, 'haveDiscount', isRtl ? 'کد تخفیف دارید؟' : 'Have a discount code?')}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t(
                  pageDict,
                  'haveDiscountDesc',
                  isRtl
                    ? 'کد را وارد کنید تا مبلغ سفارش به‌صورت خودکار به‌روز شود.'
                    : 'Enter a code to update your order total automatically.'
                )}
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Input
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder={t(pageDict, 'discountPlaceholder', isRtl ? 'مثلاً: START2026' : 'e.g. START2026')}
                  className="h-11 rounded-xl"
                  disabled={!!discount || isCheckingDiscount}
                />
                <Button
                  type="button"
                  className="h-11 shrink-0 rounded-xl bg-slate-900 px-6 text-white hover:bg-slate-800"
                  onClick={handleApplyDiscount}
                  disabled={!!discount || isCheckingDiscount || !discountInput.trim()}
                >
                  {isCheckingDiscount ? <Loader2 className="h-4 w-4 animate-spin" /> : t(pageDict, 'applyCode', isRtl ? 'اعمال کد' : 'Apply code')}
                </Button>
              </div>
              {discount ? (
                <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <p>
                    {t(pageDict, 'discountSuccessPrefix', isRtl ? 'کد تخفیف' : 'Discount code')}{' '}
                    <strong>{discount.code}</strong>{' '}
                    {t(
                      pageDict,
                      'discountSuccessSuffix',
                      isRtl
                        ? `با موفقیت اعمال شد (${formatPrice(discount.amount)}).`
                        : `applied successfully (${formatPrice(discount.amount)}).`
                    )}
                  </p>
                  <button type="button" className="text-emerald-700" onClick={removeDiscount} aria-label="remove discount">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </section>

            {/* Suggestions */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {t(pageDict, 'suggestionsTitle', isRtl ? 'پیشنهادهای تکمیلی' : 'Supplementary recommendations')}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {t(
                      pageDict,
                      'suggestionsDesc',
                      isRtl
                        ? 'برای کامل‌تر شدن مسیر یادگیری‌تان این دوره‌ها را هم ببینید.'
                        : 'See these courses to complete your learning path.'
                    )}
                  </p>
                </div>
                <Link href="/courses" className="text-sm font-medium text-sky-600 hover:underline">
                  {t(pageDict, 'viewAll', isRtl ? 'مشاهده همه' : 'View all')}
                </Link>
              </div>

              {loadingSuggestions ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : suggestions.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  {t(pageDict, 'noSuggestions', isRtl ? 'پیشنهاد تکمیلی فعالی وجود ندارد.' : 'No complementary courses right now.')}
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {suggestions.map((course) => (
                    <article key={course.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50">
                      <div className="relative aspect-[16/9] bg-slate-200">
                        <Image
                          src={getCourseImageUrl(course.titleImage)}
                          alt={course.title}
                          fill
                          className="object-cover"
                          sizes="(max-width:768px) 100vw, 280px"
                        />
                      </div>
                      <div className="space-y-3 p-4">
                        <h3 className="line-clamp-2 text-sm font-bold leading-6 text-slate-900">{course.title}</h3>
                        <p className="line-clamp-2 text-xs leading-5 text-slate-500">
                          {course.shortDescription || course.teacherName || course.categoryName}
                        </p>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-extrabold text-slate-900">{formatPrice(course.price)}</span>
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-xl"
                            disabled={isAdding}
                            onClick={() => handleAddSuggestion(course.id)}
                          >
                            {t(pageDict, 'addToCart', isRtl ? 'افزودن به سبد' : 'Add to cart')}
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Order summary sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-3xl border border-sky-100 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.18)] sm:p-6">
              <h2 className="text-lg font-extrabold text-slate-900">
                {t(pageDict, 'orderSummary', isRtl ? 'خلاصه سفارش' : 'Order summary')}
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <SummaryRow label={t(pageDict, 'coursesSubtotal', isRtl ? 'جمع مبلغ دوره‌ها' : 'Courses total')} value={formatPrice(catalogAmount || totalAmount)} />
                <SummaryRow
                  label={t(pageDict, 'coursesDiscount', isRtl ? 'تخفیف دوره‌ها' : 'Course discounts')}
                  value={formatPrice(courseDiscountAmount)}
                  valueClassName="text-emerald-600"
                />
                <SummaryRow
                  label={t(pageDict, 'couponDiscount', isRtl ? 'کد تخفیف' : 'Discount code')}
                  value={formatPrice(discount?.amount ?? 0)}
                  valueClassName="text-emerald-600"
                />
                <SummaryRow label={t(pageDict, 'tax', isRtl ? 'مالیات' : 'Tax')} value={formatPrice(0)} />
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-sm font-semibold text-slate-700">
                  {t(pageDict, 'payable', isRtl ? 'مبلغ قابل پرداخت' : 'Amount payable')}
                </span>
                <span className="text-xl font-extrabold text-sky-600">{formatPrice(finalAmount)}</span>
              </div>

              <label className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-sm text-slate-600">
                <Checkbox checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(Boolean(v))} className="mt-0.5" />
                <span>
                  {t(pageDict, 'agreeTermsLabel', isRtl ? 'شرایط و قوانین را خوانده و موافقم.' : 'I agree to the terms and conditions.')}
                </span>
              </label>

              <Button
                type="button"
                className="mt-4 h-12 w-full rounded-xl text-base font-bold"
                disabled={isSubmitting}
                onClick={handlePay}
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  t(pageDict, 'continuePay', isRtl ? 'ادامه و پرداخت' : 'Continue and pay')
                )}
              </Button>
              <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
                {t(
                  pageDict,
                  'continueDisclaimer',
                  isRtl
                    ? 'با ادامه، شرایط و قوانین سایت را می‌پذیرید.'
                    : 'By continuing, you accept the site terms and conditions.'
                )}
              </p>
            </section>

            <TrustCard
              icon={<CheckCircle2 className="h-5 w-5 text-sky-600" />}
              title={t(pageDict, 'trustAccessTitle', isRtl ? 'دسترسی فوری پس از پرداخت' : 'Immediate access after payment')}
              text={t(
                pageDict,
                'trustAccessText',
                isRtl
                  ? 'بلافاصله پس از پرداخت موفق، دوره‌ها در پنل کاربری فعال می‌شوند.'
                  : 'Courses are activated in your account right after a successful payment.'
              )}
            />
            <TrustCard
              icon={<Star className="h-5 w-5 text-emerald-600" />}
              title={t(pageDict, 'trustSupportTitle', isRtl ? 'پشتیبانی آموزشی' : 'Educational support')}
              text={t(
                pageDict,
                'trustSupportText',
                isRtl
                  ? 'در طول دوره می‌توانید سوالات‌تان را از بخش پرسش و پاسخ بپرسید.'
                  : 'Ask your course questions through the Q&A section during learning.'
              )}
            />
          </aside>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <p className="text-lg font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{label}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={cn('font-semibold text-slate-800', valueClassName)}>{value}</dd>
    </div>
  );
}

function TrustCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
        </div>
      </div>
    </div>
  );
}
