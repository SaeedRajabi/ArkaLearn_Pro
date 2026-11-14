import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, BarChart3, Calendar, Users, Globe } from 'lucide-react';
import type { Course } from '@/types';
import { ShowVideoWithImage } from '@/components/shared/show-video-with-image-hero';
import { RegisterFreeCourseButton } from './register-free-course-button';
import { PaidCoursePurchaseActions } from './paid-course-purchase-actions';
import { SeoTagLink } from '@/components/shared/seo-tag-link';
import { CoursePriceDisplay } from '@/components/shared/course-price-display';

type DictSlice = {
  home: { free: string };
  levels: Record<string, string>;
  courseDetailsPage: {
    discount: string;
    daysLeft: string;
    addToCart: string;
    buyNow: string;
    thisCourseIncludes: string;
    duration: string;
    lastUpdated: string;
    students: string;
    tags: string;
    installmentPlanTitle?: string;
    installmentNumber?: string;
    installmentAmount?: string;
    installmentDue?: string;
    installmentAtPurchase?: string;
    payableNow?: string;
    totalCoursePrice?: string;
  };
};

interface CourseDetailSidebarProps {
  course: Course;
  dict: DictSlice;
  lang: 'en' | 'fa';
}

export function CourseDetailSidebar({ course, dict, lang }: CourseDetailSidebarProps) {
  const title = lang === 'en' ? course.title_en : course.title;
  const pageDict = dict.courseDetailsPage;
  const phase = course.effectiveLifecyclePhase ?? course.lifecyclePhase ?? 'notStarted';
  const participantCount = course.enrollmentCount ?? 0;
  const isInstallment =
    course.paymentType === 'installment' && (course.installmentPlans?.length ?? 0) > 0;
  const sortedPlans = isInstallment
    ? [...(course.installmentPlans ?? [])].sort(
        (a, b) => a.installmentNumber - b.installmentNumber
      )
    : [];
  const payableNow =
    course.checkoutPrice ??
    sortedPlans[0]?.amountToman ??
    course.price;
  const lastUpdatedLabel = (() => {
    const raw = course.lastUpdated?.trim();
    if (!raw) return '—';
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toLocaleDateString(lang === 'en' ? 'en-US' : 'fa-IR');
    }
    return raw;
  })();
  const phaseLabel = phase === 'ended'
    ? (lang === 'fa' ? 'پایان یافته' : 'Ended')
    : phase === 'inProgress'
      ? (lang === 'fa' ? 'در حال برگزاری' : 'In progress')
      : (lang === 'fa' ? 'به زودی شروع می‌شود' : 'Starting soon');
  const registrationDeadline = course.registrationDeadlineUtc
    ? new Date(course.registrationDeadlineUtc).toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US')
    : null;
  const localeTag = lang === 'fa' ? 'fa-IR' : 'en-US';

  return (
    <div className="relative order-first lg:order-last">
      <div className="sticky top-24 space-y-6">
        <Card className="overflow-hidden shadow-2xl">
          <div className="relative aspect-video">
            <ShowVideoWithImage videoUrl={course.videoUrl} imageUrl={course.imageUrl} title={title} />
          </div>
          <CardContent className="p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant={phase === 'ended' ? 'secondary' : phase === 'inProgress' ? 'default' : 'outline'}>
                {phaseLabel}
              </Badge>
              {registrationDeadline && phase === 'notStarted' && (
                <span className="text-xs text-muted-foreground">
                  {lang === 'fa' ? `مهلت ثبت‌نام: ${registrationDeadline}` : `Registration until: ${registrationDeadline}`}
                </span>
              )}
            </div>
            <div className="mb-4">
              {isInstallment ? (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    {pageDict.payableNow ?? (lang === 'fa' ? 'مبلغ قابل پرداخت الان' : 'Payable now')}
                  </div>
                  <div className="text-3xl font-bold tracking-tight">
                    {Number(payableNow).toLocaleString(localeTag)}{' '}
                    <span className="text-base font-medium text-muted-foreground">
                      {lang === 'fa' ? 'تومان' : 'Toman'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {pageDict.totalCoursePrice ?? (lang === 'fa' ? 'مبلغ کل دوره' : 'Total course price')}:{' '}
                    {Number(course.price).toLocaleString(localeTag)}{' '}
                    {lang === 'fa' ? 'تومان' : 'Toman'}
                  </div>
                </div>
              ) : (
                <CoursePriceDisplay
                  price={course.price}
                  originalPrice={course.originalPrice}
                  discountPercentage={course.discountPercentage}
                  lang={lang}
                  freeLabel={dict.home.free}
                  discountLabel={pageDict.discount}
                  size="lg"
                  showDiscountBadge
                />
              )}
              {course.deadline && course.discountPercentage && (
                <div className="mt-1 flex items-center gap-1 text-sm text-destructive">
                  <Clock className="h-4 w-4" />
                  {course.deadline} {pageDict.daysLeft}
                </div>
              )}
            </div>

            {isInstallment ? (
              <div className="mb-4 space-y-2">
                <h4 className="text-sm font-semibold">
                  {pageDict.installmentPlanTitle ??
                    (lang === 'fa' ? 'جدول اقساط' : 'Installment plan')}
                </h4>
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-start font-medium">
                          {pageDict.installmentNumber ?? (lang === 'fa' ? 'قسط' : 'Installment')}
                        </th>
                        <th className="px-3 py-2 text-start font-medium">
                          {pageDict.installmentAmount ?? (lang === 'fa' ? 'مبلغ' : 'Amount')}
                        </th>
                        <th className="px-3 py-2 text-start font-medium">
                          {pageDict.installmentDue ?? (lang === 'fa' ? 'سررسید' : 'Due')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPlans.map((plan) => (
                        <tr key={plan.installmentNumber} className="border-t">
                          <td className="px-3 py-2">#{plan.installmentNumber}</td>
                          <td className="px-3 py-2">
                            {Number(plan.amountToman).toLocaleString(localeTag)}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {plan.installmentNumber === 1 || !plan.dueDateUtc
                              ? pageDict.installmentAtPurchase ??
                                (lang === 'fa' ? 'در خرید' : 'At purchase')
                              : new Date(plan.dueDateUtc).toLocaleDateString(localeTag)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              {course.canRegister !== false ? (
                course.price === 0 ? (
                  <RegisterFreeCourseButton
                    courseId={course.id}
                    label={
                      phase === 'ended'
                        ? lang === 'fa'
                          ? 'ثبت‌نام و دسترسی به آرشیو'
                          : 'Enroll & access archive'
                        : lang === 'fa'
                          ? 'ثبت نام رایگان'
                          : 'Enroll Free'
                    }
                    className="w-full"
                  />
                ) : (
                  <PaidCoursePurchaseActions
                    courseId={course.id}
                    addToCartLabel={pageDict.addToCart}
                    buyNowLabel={
                      phase === 'ended'
                        ? lang === 'fa'
                          ? 'خرید و دسترسی به آرشیو'
                          : 'Buy & access archive'
                        : pageDict.buyNow
                    }
                    className="w-full"
                  />
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  {lang === 'fa'
                    ? 'ثبت‌نام در این دوره بسته شده است. فقط دانشجویان قبلی می‌توانند ویدیوها را ببینند.'
                    : 'Registration is closed for this course. Only previously enrolled students can watch videos.'}
                </p>
              )}
            </div>

            <Separator className="my-6" />

            <h3 className="font-headline mb-4 text-lg font-bold">{pageDict.thisCourseIncludes}</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span>
                  {course.duration} {pageDict.duration}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>{dict.levels[course.level]}</span>
              </li>
              <li className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span>
                  {pageDict.lastUpdated} {lastUpdatedLabel}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span>
                  {participantCount} {pageDict.students}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" />
                <span>{course.language}</span>
              </li>
            </ul>

            <Separator className="my-6" />

            <h3 className="font-headline mb-4 text-lg font-bold">{pageDict.tags}</h3>
            <div className="flex flex-wrap gap-2">
              {course.tags.map((tag) => (
                <SeoTagLink key={tag} tag={tag} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
