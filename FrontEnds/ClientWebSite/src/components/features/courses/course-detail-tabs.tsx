"use client";

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Circle, Download, FileText, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CourseReviews from '@/components/course-reviews';
import { InstructorCard } from '@/components/shared/instructor-card';
import type { Course } from '@/types';
import { cn } from '@/lib/utils';
import { RichHtmlContent } from '@/components/shared/rich-html-content';
import { BrandedVideoPlayer } from '@/components/shared/branded-video-player';
import {
  getAllLessonVideosZipUrl,
  getLessonVideoDownloadUrl,
  getLessonVideoStreamUrl,
  getMyCourseLessonProgress,
  getMyCourses,
  getCourseMaterialDownloadUrl,
  listCourseMaterialsForStudent,
  reportLessonWatchProgress,
  type LessonWatchProgress,
  type StudentCourseMaterial,
} from '@/lib/api/courses';
import { canAccessLessonVideo, type CourseLifecyclePhase } from '@/lib/course-lifecycle-ui';

type DictSlice = {
  courseDetailsPage: {
    descriptionTab: string;
    curriculumTab: string;
    instructorTab: string;
    reviewsTab: string;
    faqTab: string;
    qaTab: string;
    whatYouWillLearn: string;
    courseDescription: string;
    courseCurriculum: string;
    lectures: string;
    preview: string;
    faqTitle: string;
    instructorCourses: string;
    instructorArticles: string;
    instructorPoints: string;
    aboutInstructor: string;
    viewProfile: string;
    downloadAllVideos?: string;
    watchLesson?: string;
    downloadLesson?: string;
    enrollToWatch?: string;
    enrollToWatchLesson?: string;
    enrollDialogTitle?: string;
    enrollDialogMessage?: string;
    comingSoon?: string;
  };
  levels?: Record<string, string>;
};

type CurriculumLesson = Course['curriculum'][number]['lessons'][number];

interface CourseDetailTabsProps {
  course: Course;
  dict: DictSlice;
  lang: 'en' | 'fa';
}

export function CourseDetailTabs({ course, dict, lang }: CourseDetailTabsProps) {
  const pageDict = dict.courseDetailsPage;
  const longDescription = lang === 'en' ? course.longDescription_en : course.longDescription;
  const whatYouWillLearn = lang === 'en' ? course.whatYouWillLearn_en : course.whatYouWillLearn;
  const totalLectures = course.curriculum.reduce((acc, m) => acc + m.lessons.length, 0);
  const [isEnrolled, setIsEnrolled] = React.useState(false);
  const [activeLesson, setActiveLesson] = React.useState<CurriculumLesson | null>(null);
  const [enrollPromptOpen, setEnrollPromptOpen] = React.useState(false);
  const [enrollPromptLesson, setEnrollPromptLesson] = React.useState<CurriculumLesson | null>(null);
  const [lessonProgress, setLessonProgress] = React.useState<Record<string, LessonWatchProgress>>({});
  const [courseMaterials, setCourseMaterials] = React.useState<StudentCourseMaterial[]>([]);
  const [materialDialog, setMaterialDialog] = React.useState<{
    title: string;
    materials: StudentCourseMaterial[];
  } | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const lastReportedSecondRef = React.useRef(0);

  React.useEffect(() => {
    let cancelled = false;
    getMyCourses()
      .then((courses) => {
        if (!cancelled) {
          setIsEnrolled(courses.some((item) => String(item.id) === String(course.id)));
        }
      })
      .catch(() => {
        if (!cancelled) setIsEnrolled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [course.id]);

  React.useEffect(() => {
    if (!isEnrolled) {
      setLessonProgress({});
      return;
    }

    let cancelled = false;
    getMyCourseLessonProgress(Number(course.id))
      .then((items) => {
        if (cancelled) return;
        const map: Record<string, LessonWatchProgress> = {};
        for (const item of items) {
          map[String(item.lessonId)] = item;
        }
        setLessonProgress(map);
      })
      .catch(() => {
        if (!cancelled) setLessonProgress({});
      });

    return () => {
      cancelled = true;
    };
  }, [isEnrolled, course.id]);

  const phase = (course.effectiveLifecyclePhase ?? course.lifecyclePhase ?? 'notStarted') as CourseLifecyclePhase;

  const isDesktopLicenseCourse = course.deliveryMode === 'desktopLicense';
  const isExternalLicensedCourse = isDesktopLicenseCourse;

  React.useEffect(() => {
    if (!isEnrolled || isDesktopLicenseCourse) {
      setCourseMaterials([]);
      setMaterialDialog(null);
      return;
    }

    let cancelled = false;
    listCourseMaterialsForStudent(course.id)
      .then((items) => {
        if (!cancelled) setCourseMaterials(items);
      })
      .catch(() => {
        if (!cancelled) setCourseMaterials([]);
      });

    return () => {
      cancelled = true;
    };
  }, [course.id, isDesktopLicenseCourse, isEnrolled]);

  const lessonIsAccessible = React.useCallback(
    (lesson: CurriculumLesson) => {
      if (isDesktopLicenseCourse) return false;
      return canAccessLessonVideo(phase, lesson, isEnrolled);
    },
    [phase, isEnrolled, isDesktopLicenseCourse]
  );

  const hasAnyLessonVideos =
    !isExternalLicensedCourse &&
    course.curriculum.some((module) => module.lessons.some((lesson) => lesson.hasVideo));

  const hasAccessibleLessonVideos =
    !isExternalLicensedCourse &&
    course.curriculum.some((module) => module.lessons.some((lesson) => lessonIsAccessible(lesson)));

  const comingSoonLabel = pageDict.comingSoon ?? (lang === 'fa' ? 'به زودی' : 'Coming soon');
  const enrollLessonLabel =
    pageDict.enrollToWatchLesson ?? (lang === 'fa' ? 'ثبت‌نام لازم است' : 'Enroll required');
  const enrollDialogTitle = pageDict.enrollDialogTitle ?? (lang === 'fa' ? 'ثبت‌نام در دوره' : 'Enroll in course');
  const enrollDialogMessage =
    pageDict.enrollDialogMessage ??
    (lang === 'fa'
      ? 'برای پخش و دانلود ویدیوهای جلسات، ابتدا در این دوره ثبت‌نام کنید.'
      : 'To play or download lesson videos, please enroll in this course first.');

  const handleLessonClick = (lesson: CurriculumLesson) => {
    if (lessonIsAccessible(lesson)) {
      lastReportedSecondRef.current = 0;
      setActiveLesson(lesson);
      return;
    }
    if (!isEnrolled && lesson.hasVideo && !isExternalLicensedCourse) {
      setEnrollPromptLesson(lesson);
      setEnrollPromptOpen(true);
    }
  };

  const getLessonProgress = (lessonId: string) => lessonProgress[lessonId];

  const getSectionMaterials = (sectionId: string) =>
    courseMaterials.filter(
      (material) =>
        String(material.courseSectionId) === sectionId && material.courseLessonId == null
    );

  const getLessonMaterials = (sectionId: string, lessonId: string) =>
    courseMaterials.filter(
      (material) =>
        String(material.courseSectionId) === sectionId &&
        material.courseLessonId != null &&
        String(material.courseLessonId) === lessonId
    );

  const openMaterials = (
    event: React.MouseEvent | React.KeyboardEvent,
    title: string,
    materials: StudentCourseMaterial[]
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setMaterialDialog({ title, materials });
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getSectionProgressPercent = (module: Course['curriculum'][number]) => {
    const videoLessons = module.lessons.filter((lesson) => lessonIsAccessible(lesson));
    if (videoLessons.length === 0) return null;
    const total = videoLessons.reduce((sum, lesson) => sum + (getLessonProgress(lesson.id)?.watchedPercent ?? 0), 0);
    return Math.round(total / videoLessons.length);
  };

  const persistWatchProgress = React.useCallback(
    async (lesson: CurriculumLesson, watchedSeconds: number, durationSeconds: number) => {
      if (!isEnrolled || watchedSeconds <= 0) return;
      try {
        const result = await reportLessonWatchProgress({
          lessonId: Number(lesson.id),
          watchedSeconds: Math.floor(watchedSeconds),
          durationSeconds: Math.floor(durationSeconds),
        });
        setLessonProgress((prev) => ({ ...prev, [lesson.id]: result }));
      } catch {
        // ignore transient progress errors
      }
    },
    [isEnrolled]
  );

  React.useEffect(() => {
    if (!activeLesson) return;

    const video = videoRef.current;
    if (!video) return;

    const reportFromVideo = () => {
      const current = Math.floor(video.currentTime || 0);
      if (current <= lastReportedSecondRef.current) return;
      lastReportedSecondRef.current = current;
      const duration = Math.floor(video.duration || activeLesson.durationSeconds || 0);
      void persistWatchProgress(activeLesson, current, duration);
    };

    video.addEventListener('timeupdate', reportFromVideo);
    video.addEventListener('pause', reportFromVideo);
    video.addEventListener('ended', reportFromVideo);

    return () => {
      video.removeEventListener('timeupdate', reportFromVideo);
      video.removeEventListener('pause', reportFromVideo);
      video.removeEventListener('ended', reportFromVideo);
    };
  }, [activeLesson, persistWatchProgress]);

  const downloadAllLabel = pageDict.downloadAllVideos ?? (lang === 'fa' ? 'دانلود همه ویدیوها (ZIP)' : 'Download all videos (ZIP)');
  const watchLessonLabel = pageDict.watchLesson ?? (lang === 'fa' ? 'پخش' : 'Watch');
  const downloadLessonLabel = pageDict.downloadLesson ?? (lang === 'fa' ? 'دانلود' : 'Download');
  const enrollLabel = pageDict.enrollToWatch ?? (lang === 'fa' ? 'برای مشاهده ویدیوها ثبت‌نام کنید' : 'Enroll to watch lesson videos');

  return (
    <>
      <Tabs defaultValue="description" className="w-full" dir={lang==="fa" ? "rtl" : "ltr"}>
        <TabsList className="mb-8 grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="description">{pageDict.descriptionTab}</TabsTrigger>
          <TabsTrigger value="curriculum">{pageDict.curriculumTab}</TabsTrigger>
          <TabsTrigger value="instructor">{pageDict.instructorTab}</TabsTrigger>
          <TabsTrigger value="reviews">{pageDict.reviewsTab}</TabsTrigger>
          <TabsTrigger value="faq">{pageDict.faqTab}</TabsTrigger>
        </TabsList>

        <TabsContent value="description">
          <div className={cn('space-y-8', lang === 'fa' && 'text-right')}>
            <Card>
              <CardContent className="p-6">
                <h2 className="font-headline mb-4 text-2xl font-bold">{pageDict.whatYouWillLearn}</h2>
                <ul className="grid grid-cols-1 gap-4 text-muted-foreground sm:grid-cols-2">
                  {whatYouWillLearn.map((item, index) => (
                    <li
                      key={index}
                      className={cn('flex items-start gap-3', lang === 'fa' && 'flex-row-reverse')}
                    >
                      <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <div>
              <h2 className="font-headline mb-4 text-2xl font-bold">{pageDict.courseDescription}</h2>
              <RichHtmlContent html={longDescription ?? ''} dir={lang === 'fa' ? 'rtl' : 'ltr'} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="curriculum">
          <div>
            <div
              dir={lang==="fa" ? "ltr" : "rtl"}
              className={cn(
                'mb-4 flex flex-wrap items-center justify-between gap-4',
                lang === 'fa' && 'md:flex-row-reverse'
              )}
            >
              <h2 className="font-headline text-2xl font-bold">{pageDict.courseCurriculum}</h2>
              <div className={cn('flex flex-wrap items-center gap-3', lang === 'fa' && 'flex-row-reverse')}>
                <span className="text-sm text-muted-foreground">
                  {totalLectures} {pageDict.lectures} • {course.duration}
                </span>
                {isEnrolled && hasAccessibleLessonVideos && (
                  <Button asChild variant="outline" size="sm">
                    <a href={getAllLessonVideosZipUrl(course.id)} download>
                      <Download className="mr-2 h-4 w-4" />
                      {downloadAllLabel}
                    </a>
                  </Button>
                )}
              </div>
            </div>
            {!isEnrolled && hasAnyLessonVideos && (
              <p className="mb-4 text-sm text-muted-foreground">{enrollLabel}</p>
            )}
            {phase === 'notStarted' && (
              <p className="mb-4 text-sm text-amber-600">
                {lang === 'fa'
                  ? 'این دوره هنوز شروع نشده است. ویدیوی معرفی را ببینید و ثبت‌نام کنید.'
                  : 'This course has not started yet. Watch the intro video and register.'}
              </p>
            )}
            {phase === 'inProgress' && (
              <p className="mb-4 text-sm text-muted-foreground">
                {lang === 'fa'
                  ? 'این دوره در حال برگزاری است. فقط بخش‌های منتشرشده برای دانشجویان ثبت‌نام‌شده قابل مشاهده است.'
                  : 'This course is in progress. Only published parts are available to enrolled students.'}
              </p>
            )}
            {phase === 'ended' && (
              <p className="mb-4 text-sm text-muted-foreground">
                {isDesktopLicenseCourse
                  ? lang === 'fa'
                    ? 'این دوره پایان یافته است. ویدیوها فقط از طریق اپلیکیشن ویندوز آرکالرن با لایسنس شما قابل مشاهده است.'
                    : 'This course has ended. Videos are only available through the ArkaLearn Windows app with your license.'
                  : isEnrolled
                    ? lang === 'fa'
                      ? 'این دوره پایان یافته است. تمام ویدیوهای آپلودشده برای شما قابل مشاهده و دانلود است.'
                      : 'This course has ended. All uploaded videos are available for you to watch and download.'
                    : lang === 'fa'
                      ? 'این دوره پایان یافته است. پس از ثبت‌نام به آرشیو کامل ویدیوها دسترسی خواهید داشت.'
                      : 'This course has ended. After enrolling you will get access to the full video archive.'}
              </p>
            )}
            {isDesktopLicenseCourse && (
              <p className="mb-4 text-sm text-muted-foreground">
                {lang === 'fa'
                  ? 'این دوره فقط از طریق اپلیکیشن ویندوز آرکالرن قابل مشاهده است. پس از ثبت‌نام، لایسنس ۲۵۶ کاراکتری در داشبورد شما نمایش داده می‌شود.'
                  : 'This course is only available through the ArkaLearn Windows app. After enrollment, your 256-character license will appear in your dashboard.'}
              </p>
            )}
            <Accordion type="single" collapsible className="w-full rounded-lg border">
              {course.curriculum.map((module, moduleIndex) => {
                const sectionProgress = getSectionProgressPercent(module);
                const sectionMaterials = getSectionMaterials(module.id);
                const sectionTitle = lang === 'en' ? module.title_en : module.title;
                return (
                <AccordionItem key={module.id} value={`item-${moduleIndex}`}>
                  <AccordionTrigger className="bg-muted/50 px-6 py-4 hover:no-underline">
                    <div className={cn('flex-1', lang === 'fa' ? 'text-right' : 'text-start')}>
                      <h3 className={cn('flex items-center gap-2 font-semibold', lang === 'fa' && 'flex-row-reverse')}>
                        <span>{sectionTitle}</span>
                        {sectionMaterials.length > 0 ? (
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label={lang === 'fa' ? 'فایل‌های این بخش' : 'Section files'}
                            className="rounded p-1 text-primary hover:bg-primary/10"
                            onClick={(event) => openMaterials(event, sectionTitle, sectionMaterials)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                openMaterials(event, sectionTitle, sectionMaterials);
                              }
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </span>
                        ) : null}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {module.lessons.length} {pageDict.lectures}
                        {isEnrolled && sectionProgress != null ? (
                          <span className="mx-2">• {sectionProgress}%</span>
                        ) : null}
                      </p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul dir={lang === 'fa' ? 'ltr' : 'rtl'} className="divide-y">
                      {module.lessons.map((lesson) => {
                        const progress = getLessonProgress(lesson.id);
                        const completed = Boolean(progress?.isCompleted);
                        const progressLabel = progress?.watchedPercent ?? 0;
                        const accessible = lessonIsAccessible(lesson);
                        const showEnrollRequired = !isEnrolled && lesson.hasVideo && !isExternalLicensedCourse;
                        const showComingSoon = isEnrolled && lesson.hasVideo && !accessible;
                        const canInteractWithLesson = accessible || showEnrollRequired;
                        const lessonMaterials = getLessonMaterials(module.id, lesson.id);
                        const lessonTitle = lang === 'en' ? lesson.title_en : lesson.title;

                        return (
                        <li
                          key={lesson.id}
                          className={cn(
                            'flex items-center justify-between gap-3 p-4 hover:bg-muted/50',
                            lang === 'fa' && 'flex-row-reverse'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => handleLessonClick(lesson)}
                            disabled={!canInteractWithLesson}
                            className={cn(
                              'flex min-w-0 flex-1 items-center gap-3 text-start',
                              lang === 'fa' && 'flex-row-reverse text-right',
                              canInteractWithLesson ? 'cursor-pointer' : 'cursor-default'
                            )}
                          >
                            {completed ? (
                              <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
                            ) : accessible && progressLabel > 0 ? (
                              <Circle className="h-5 w-5 shrink-0 text-primary" />
                            ) : (
                              <PlayCircle
                                className={cn(
                                  'h-5 w-5 shrink-0',
                                  accessible || showEnrollRequired ? 'text-primary' : 'text-muted-foreground'
                                )}
                              />
                            )}
                            <span
                              className={cn(
                                'truncate',
                                !accessible && lesson.hasVideo && !showEnrollRequired && 'opacity-70'
                              )}
                            >
                              {lang === 'en' ? lesson.title_en : lesson.title}
                            </span>
                          </button>
                          <div className={cn('flex shrink-0 items-center gap-2', lang === 'fa' && 'flex-row-reverse')}>
                            {showEnrollRequired ? (
                              <Badge variant="outline">{enrollLessonLabel}</Badge>
                            ) : null}
                            {showComingSoon ? (
                              <Badge variant="secondary">{comingSoonLabel}</Badge>
                            ) : null}
                            {lesson.isPreview ? (
                              <Badge variant="outline">{pageDict.preview}</Badge>
                            ) : null}
                            {accessible && progressLabel > 0 ? (
                              <Badge variant={completed ? 'default' : 'secondary'}>
                                {completed
                                  ? (lang === 'fa' ? 'تکمیل' : 'Done')
                                  : `${progressLabel}%`}
                              </Badge>
                            ) : null}
                            {lessonMaterials.length > 0 ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary"
                                aria-label={lang === 'fa' ? 'فایل‌های این درس' : 'Lesson files'}
                                onClick={(event) => openMaterials(event, lessonTitle, lessonMaterials)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            ) : null}
                            <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                            {accessible && (
                              <>
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleLessonClick(lesson)}>
                                  {watchLessonLabel}
                                </Button>
                                <Button asChild variant="ghost" size="sm">
                                  <a href={getLessonVideoDownloadUrl(lesson.id)} download>
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </>
                            )}
                          </div>
                        </li>
                      )})}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )})}
            </Accordion>
          </div>
        </TabsContent>

        <TabsContent value="instructor">
          <InstructorCard
            instructor={course.instructor}
            lang={lang}
            dict={{
              instructorCourses: pageDict.instructorCourses,
              instructorArticles: pageDict.instructorArticles,
              instructorPoints: pageDict.instructorPoints,
              aboutInstructor: pageDict.aboutInstructor,
              viewProfile: pageDict.viewProfile,
            }}
          />
        </TabsContent>

        <TabsContent value="reviews">
          <CourseReviews course={course} dict={dict as import('@/types').Dictionary} />
        </TabsContent>

        <TabsContent value="faq">
          <div className={cn('space-y-4', lang === 'fa' && 'text-right')}>
            <h2 className="font-headline mb-6 text-2xl font-bold">{pageDict.faqTitle}</h2>
            <Accordion type="single" collapsible className="w-full">
              {course.faq?.map((faqItem, index) => (
                <AccordionItem key={faqItem.id} value={`item-${index}`} className="border-b">
                  <AccordionTrigger className="py-6 hover:no-underline">
                    <span
                      className={cn(
                        'flex-1 text-lg font-semibold',
                        lang === 'fa' ? 'text-right' : 'text-left'
                      )}
                    >
                      {lang === 'en' ? faqItem.question_en : faqItem.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p
                      className={cn(
                        'leading-relaxed text-muted-foreground pt-2 pb-4',
                        lang === 'fa' ? 'text-right' : 'text-left'
                      )}
                    >
                      {lang === 'en' ? faqItem.answer_en : faqItem.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!materialDialog} onOpenChange={(open) => !open && setMaterialDialog(null)}>
        <DialogContent className="max-w-lg" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{materialDialog?.title ?? ''}</DialogTitle>
          </DialogHeader>
          <div className="divide-y rounded-md border">
            {materialDialog?.materials.map((material) => {
              const fileName =
                material.displayName || material.originalFileName || (lang === 'fa' ? 'فایل دوره' : 'Course file');
              const fileSize = formatFileSize(material.fileSizeBytes);
              return (
                <div key={String(material.id)} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{fileName}</p>
                    {material.originalFileName && material.originalFileName !== fileName ? (
                      <p className="truncate text-xs text-muted-foreground">{material.originalFileName}</p>
                    ) : null}
                    {fileSize ? <p className="text-xs text-muted-foreground">{fileSize}</p> : null}
                  </div>
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <a href={getCourseMaterialDownloadUrl(material)} download>
                      <Download className="h-4 w-4" />
                      <span className="ms-2">{lang === 'fa' ? 'دانلود' : 'Download'}</span>
                    </a>
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={enrollPromptOpen}
        onOpenChange={(open) => {
          setEnrollPromptOpen(open);
          if (!open) setEnrollPromptLesson(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{enrollDialogTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{enrollDialogMessage}</p>
          {enrollPromptLesson ? (
            <p className="text-sm font-medium">
              {lang === 'en' ? enrollPromptLesson.title_en : enrollPromptLesson.title}
            </p>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeLesson} onOpenChange={(open) => !open && setActiveLesson(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {activeLesson ? (lang === 'en' ? activeLesson.title_en : activeLesson.title) : ''}
            </DialogTitle>
          </DialogHeader>
          {activeLesson && (
            <div className="space-y-4">
              <BrandedVideoPlayer className="w-full rounded-lg bg-black">
                <video
                  ref={videoRef}
                  src={getLessonVideoStreamUrl(activeLesson.id)}
                  controls
                  className="w-full rounded-lg bg-black"
                  playsInline
                />
              </BrandedVideoPlayer>
              <div className={cn('flex items-center justify-between gap-3', lang === 'fa' && 'flex-row-reverse')}>
                <span className="text-sm text-muted-foreground">{activeLesson.duration}</span>
                <Button asChild variant="outline" size="sm">
                  <a href={getLessonVideoDownloadUrl(activeLesson.id)} download>
                    <Download className="mr-2 h-4 w-4" />
                    {downloadLessonLabel}
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
