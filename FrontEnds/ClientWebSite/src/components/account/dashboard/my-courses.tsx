'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link as LinkIcon, Key, CalendarDays, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getMyCourses } from '@/lib/api/courses';
import { requestDesktopLicense } from '@/lib/api/desktop-licenses';
import { useAuth } from '@/contexts/auth-context';
import { PlaceHolderImages } from '@/lib/constants/placeholder-images';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary, MyCourse } from '@/types';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getCourseImageUrl } from '@/lib/utils/image-url';
import { getCourseUrl } from '@/lib/course-slug';
import { DesktopAppDownloadPanel } from '@/components/desktop-app/desktop-app-download-panel';
import { getApiErrorMessage } from '@/lib/api/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function hasOnlineClass(course: MyCourse): boolean {
  const url = course.onlineClassUrl?.trim();
  return Boolean(url && /^https?:\/\//i.test(url));
}

const OnlineClassAccessDialog = ({ course, dict }: { course: MyCourse; dict: Dictionary }) => {
  const { dir } = useLanguage();
  const openLabel = getDictValue(dict, 'dashboard.common.open', 'Open');
  if (!hasOnlineClass(course) || !course.onlineClassUrl) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-2">
          {getDictValue(dict, 'dashboard.myCourses.access', 'Access Info')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir={dir}>
        <DialogHeader>
          <DialogTitle>{course.title}</DialogTitle>
          <DialogDescription>
            {getDictValue(dict, 'dashboard.myCourses.accessDesc', 'Access details for this course.')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              {getDictValue(dict, 'dashboard.myCourses.onlineClassUrl', 'Online Class URL')}
            </Label>
            <div className="flex gap-2">
              <Input id="url" value={course.onlineClassUrl} readOnly />
              <Button asChild size="sm">
                <a href={course.onlineClassUrl} target="_blank" rel="noreferrer">{openLabel}</a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const LicenseAccessBlock = ({
  course,
  dict,
  onRequested,
}: {
  course: MyCourse;
  dict: Dictionary;
  onRequested?: () => void;
}) => {
  const { toast } = useToast();
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const [requesting, setRequesting] = useState(false);
  const copyLabel = getDictValue(dict, 'dashboard.common.copy', 'Copy');

  if (course.deliveryMode !== 'desktopLicense') return null;

  const licenseValue = (course.desktopLicenseKey ?? '').trim();

  if (!licenseValue) {
    if (course.isLicenseRequestPending) {
      return (
        <p className="w-full rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100 sm:max-w-xs sm:text-end">
          {isRtl
            ? 'درخواست لایسنس ثبت شده و در انتظار تأیید استاد است.'
            : 'License request submitted — waiting for instructor approval.'}
        </p>
      );
    }

    return (
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
        <p className="w-full text-xs text-muted-foreground sm:max-w-xs sm:text-end">
          {isRtl
            ? 'لایسنس دسکتاپ هنوز صادر نشده. برای دریافت لایسنس درخواست دهید.'
            : 'Desktop license is not ready yet. Request a license from your instructor.'}
        </p>
        <Button
          size="sm"
          disabled={requesting}
          onClick={async () => {
            setRequesting(true);
            try {
              const message = await requestDesktopLicense(course.id);
              toast({
                title: isRtl ? 'درخواست ثبت شد' : 'Request submitted',
                description: isRtl
                  ? 'ایمیل و اعلان برای استاد ارسال شد.'
                  : message || 'Instructor was notified by email and in-app notification.',
              });
              onRequested?.();
            } catch (error) {
              toast({
                title: getApiErrorMessage(
                  error,
                  isRtl ? 'ثبت درخواست انجام نشد' : 'Could not submit license request',
                ),
                variant: 'destructive',
              });
            } finally {
              setRequesting(false);
            }
          }}
        >
          <Key className="me-1.5 h-3.5 w-3.5" />
          {requesting
            ? isRtl
              ? 'در حال ارسال…'
              : 'Sending…'
            : isRtl
              ? 'درخواست لایسنس'
              : 'Request license'}
        </Button>
      </div>
    );
  }

  const copyToken = async () => {
    await navigator.clipboard.writeText(licenseValue);
    toast({ title: getDictValue(dict, 'dashboard.myCourses.copied', 'Copied') });
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <div className="flex min-h-9 flex-1 items-center rounded-md border bg-background px-3 py-1.5 text-xs font-mono text-muted-foreground sm:min-w-52 sm:flex-none">
          <Key className="me-2 h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {getDictValue(dict, 'dashboard.myCourses.desktopLicense', 'Desktop app license')}
            : {licenseValue.slice(0, 18)}…
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={copyToken}>
          {copyLabel}
        </Button>
      </div>
      <div className="flex max-w-xs flex-col gap-1.5 sm:items-end">
        <p className="text-xs text-muted-foreground sm:text-end">
          {getDictValue(
            dict,
            'dashboard.myCourses.desktopLicenseHint',
            'Enter this license in the ArkaLearn Windows app under Videos.',
          )}
        </p>
        <Link
          href="/account/desktop-app"
          className="text-xs font-medium text-primary hover:underline"
        >
          {getDictValue(dict, 'dashboard.myCourses.downloadDesktopApp', 'Download Windows app')}
        </Link>
      </div>
    </div>
  );
};

const EnrolledCourseRow = ({
  course,
  dict,
  onLicenseRequested,
}: {
  course: MyCourse;
  dict: Dictionary;
  onLicenseRequested?: () => void;
}) => {
  const viewCourseText = getDictValue(dict, 'dashboard.myCourses.viewCourse', getDictValue(dict, 'coursesPage.viewCourse', 'View Course'));
  const paidLabel = getDictValue(dict, 'dashboard.myCourses.paid', 'Paid');
  const freeLabel = getDictValue(dict, 'dashboard.myCourses.free', 'Free');
  const enrolledAtLabel = getDictValue(dict, 'dashboard.myCourses.enrolledAt', 'Enrolled');
  const statusLabel = course.effectiveLifecyclePhase === 'inProgress'
      ? getDictValue(dict, 'dashboard.myCourses.inProgress', 'In progress')
      : course.effectiveLifecyclePhase === 'ended'
        ? getDictValue(dict, 'dashboard.myCourses.ended', 'Ended')
        : getDictValue(dict, 'dashboard.myCourses.status', 'Active');
  const image = PlaceHolderImages.find(p => p.id === `course-${course.id}`);

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center">
      <div className="h-20 w-full overflow-hidden rounded-md bg-muted sm:h-24 sm:w-36">
        <img
          src={course.imageUrl ? getCourseImageUrl(course.imageUrl) : image?.imageUrl || '/images/placeholder.jpg'}
          alt={course.title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold">{course.title}</h3>
          <Badge variant={course.isFree ? 'secondary' : 'default'}>
            {course.isFree ? freeLabel : paidLabel}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {statusLabel}
          </Badge>
          {course.deliveryMode === 'desktopLicense' ? (
            <Badge variant="secondary">
              {getDictValue(dict, 'dashboard.myCourses.desktopLicense', 'Desktop app license')}
            </Badge>
          ) : null}
        </div>
        {course.effectiveLifecyclePhase === 'inProgress' && course.progress > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            {getDictValue(dict, 'dashboard.myCourses.progress', 'Progress')}: {course.progress}%
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {course.enrollmentDateTime && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {enrolledAtLabel}: {course.enrollmentDateTime}
            </span>
          )}
          {!course.isFree && course.price != null && (
            <span className="inline-flex items-center gap-1.5">
              {getDictValue(dict, 'dashboard.myCourses.price', 'Price')}: {Number(course.price).toLocaleString('fa-IR')} تومان
            </span>
          )}
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
        <Button asChild size="sm" variant="default">
          <Link href={getCourseUrl({ id: course.id, title: course.title })}>{viewCourseText}</Link>
        </Button>
        <LicenseAccessBlock course={course} dict={dict} onRequested={onLicenseRequested} />
        <OnlineClassAccessDialog course={course} dict={dict} />
      </div>
    </div>
  );
};

export function MyCourses({ dict }: { dict: Dictionary }) {
  const [courses, setCourses] = useState<MyCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const fetchCourses = useCallback(async () => {
    if (!isAuthenticated) {
      setCourses([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getMyCourses();
      setCourses(data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    void fetchCourses();
  }, [authLoading, fetchCourses]);

  const renderLoadingSkeletons = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );

  const myCoursesTitle = getDictValue(dict, 'dashboard.myCourses.title', 'My Courses');
  const myCoursesSubtitle = getDictValue(dict, 'dashboard.myCourses.subtitle', "All the courses you are currently enrolled in.");
  const emptyDesc = getDictValue(dict, 'dashboard.myCourses.empty', "You haven't enrolled in any courses yet.");

  const hasDesktopCourse = courses.some((course) => course.deliveryMode === 'desktopLicense');

  if (!isLoading && courses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{myCoursesTitle}</CardTitle>
          <CardDescription>{emptyDesc}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {hasDesktopCourse ? (
        <DesktopAppDownloadPanel dict={dict} variant="compact" audience="student" />
      ) : null}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{myCoursesTitle}</CardTitle>
            <CardDescription>{myCoursesSubtitle}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? renderLoadingSkeletons() : (
            <div className="space-y-4">
              {courses.map((course) => (
                 <EnrolledCourseRow
                   key={course.id}
                   course={course}
                   dict={dict}
                   onLicenseRequested={fetchCourses}
                 />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
