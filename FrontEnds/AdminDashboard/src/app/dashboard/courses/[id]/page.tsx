
'use client';

import * as React from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Globe,
  MoreVertical,
  Star,
  Tag,
  Users,
  DollarSign,
  BarChart,
  Edit,
  PlayCircle,
  File,
  CheckCircle2,
  AlertCircle,
  Share2,
  Heart,
  ShoppingCart,
  MonitorPlay,
  Award,
  ChevronDown,
  ChevronUp,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import Image from 'next/image';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useLanguage } from '@/components/language-provider';
import type { Course } from '@/lib/types';
import { useStore } from '@/lib/store';
import CourseDetailsLoading from './loading';
import { format } from 'date-fns';
import { CourseFormModal } from '../components/course-form-modal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { CourseEnrollmentsDashboard } from '@/components/students/course-enrollments-dashboard';
import { RichHtmlContent } from '@/components/shared/rich-html-content';
import { toSameOriginAssetSrc } from '@/lib/apiClient';

export default function CourseDetailsPage() {
  const { t, direction } = useLanguage();
  const params = useParams();
  const courseId = params.id as string;
  const { courses, users, getCourseDetails } = useStore();
  const [course, setCourse] = React.useState<Course | null | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);

  // Suggested courses (mock or real)
  const relatedCourses = courses.filter(c => c.id !== courseId).slice(0, 3);

  React.useEffect(() => {
    const loadCourse = async () => {
        if (courseId) {
            const fullDetails = await getCourseDetails(courseId);
            setCourse(fullDetails ?? null);
        }
    };
    loadCourse();
  }, [courseId, getCourseDetails]);

  if (course === undefined) {
    return <CourseDetailsLoading />;
  }

  if (course === null) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
            <h2 className="text-2xl font-bold">{t('course_not_found')}</h2>
            <Button asChild>
                <Link href="/dashboard/courses">{t('back_to_courses')}</Link>
            </Button>
        </div>
    );
  }
  
  const instructor = users.find(u => u.id === course.instructorId);
  const thumbnailSrc = typeof course.thumbnailUrl === 'string'
    ? toSameOriginAssetSrc(course.thumbnailUrl)
    : null;
  const videoSrc =
    typeof course.videoUrl === 'string' && !course.videoUrl.trim().toLowerCase().startsWith('drm://')
      ? toSameOriginAssetSrc(course.videoUrl)
      : null;

  // Safe formatting for date
  const formatDate = (date: Date) => {
    try {
      return format(date, 'yyyy/MM/dd');
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <>
    <div className="space-y-8 animate-in fade-in duration-500" dir={direction}>
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-primary transition-colors">{t('breadcrumb_dashboard')}</Link>
          <span>/</span>
          <Link href="/dashboard/courses" className="hover:text-primary transition-colors">{t('breadcrumb_courses')}</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{course.title}</span>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={() => setIsEditModalOpen(true)} variant="secondary" className="gap-2">
                <Edit className="h-4 w-4" />
                {t('actions_edit')}
            </Button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="outline">
                    <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>{t('actions_view_students')}</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                        {t('actions_delete')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
                 <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded-md">
                    {course.category || 'Web Design'}
                 </Badge>
                 <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                    {course.title}
                 </h1>
                 <p className="text-lg text-muted-foreground leading-relaxed">
                    {course.shortDescription}
                 </p>
                 
                 <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-2">
                    <div className="flex items-center gap-1.5 text-yellow-500 font-medium">
                        <Star className="h-5 w-5 fill-current" />
                        <span className="text-foreground">4.5</span>
                        <span className="text-muted-foreground">{t('no_rating_yet')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Users className="h-5 w-5 text-primary" />
                        <span>{course.studentCount.toLocaleString()} {t('course_details_students_count')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span>{t('course_details_last_updated')}: {formatDate(course.createdAt)}</span>
                    </div>
                 </div>
            </div>

            {/* Video/Image Player */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-xl bg-black/5 border border-border/50 group">
                {videoSrc ? (
                    <video 
                        controls 
                        src={videoSrc} 
                        poster={thumbnailSrc ?? undefined}
                        className="w-full h-full object-cover" 
                    />
                ) : (
                    thumbnailSrc ? (
                        <Image
                            src={thumbnailSrc}
                            alt={course.title}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <MonitorPlay className="h-16 w-16 mb-4 opacity-50" />
                            <p>{t('course_details_no_preview')}</p>
                        </div>
                    )
                )}
            </div>

            {/* Tabs Section */}
             <Tabs defaultValue="description" className="w-full" dir={direction}>
                <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl mb-6 flex-wrap gap-2">
                  <TabsTrigger value="description" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    {t('course_details_tab_description')}
                  </TabsTrigger>
                  <TabsTrigger value="sessions" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    {t('course_details_tab_sessions')}
                  </TabsTrigger>
                  <TabsTrigger value="faqs" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    {t('course_details_tab_faqs')}
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    {t('course_details_tab_reviews')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                    <Card className="border-none shadow-sm bg-card/50">
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold">{t('course_details_about')}</h3>
                                
                                <div className={`relative ${!isDescriptionExpanded ? 'max-h-[300px] overflow-hidden' : ''} transition-all duration-500 ease-in-out`}>
                                     <RichHtmlContent 
                                        dir="auto" 
                                        className="prose dark:prose-invert max-w-none text-muted-foreground" 
                                        html={course.description}
                                     />
                                     {!isDescriptionExpanded && (
                                         <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent" />
                                     )}
                                </div>
                                
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    className="w-full mt-2 gap-2 text-primary hover:text-primary hover:bg-primary/10"
                                >
                                    {isDescriptionExpanded ? (
                                        <>{t('read_less')} <ChevronUp className="h-4 w-4" /></>
                                    ) : (
                                        <>{t('read_more')} <ChevronDown className="h-4 w-4" /></>
                                    )}
                                </Button>
                            </div>
                            
                            {/* "What you will learn" Section (Static Mock for layout) */}
                            {/* <div className="mt-8 p-6 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
                                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-green-700 dark:text-green-400">
                                    <CheckCircle2 className="h-5 w-5" />
                                    What you will learn
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {['Master the basics of the topic', 'Build real-world projects', 'Understand advanced concepts', 'Best practices and patterns'].map((item, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div> */}

                            {course.faqs && course.faqs.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-xl font-bold mb-4">{t('course_details_tab_faqs')}</h3>
                                    <Accordion type="single" collapsible className="w-full">
                                        {course.faqs.map((faq, index) => (
                                            <AccordionItem key={index} value={`item-${index}`}>
                                                <AccordionTrigger className="text-start font-medium">
                                                    {faq.question}
                                                </AccordionTrigger>
                                                <AccordionContent className="text-muted-foreground">
                                                    {faq.answer}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </div>
                            )}

                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sessions" className="animate-in slide-in-from-left-2 duration-300">
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-6">
                            {course.sections && course.sections.length > 0 ? (
                              <Accordion type="single" collapsible defaultValue="section-0" className="w-full space-y-2" dir={direction}>
                                {course.sections.map((section, idx) => (
                                  <AccordionItem key={section.id} value={`section-${idx}`} className="border rounded-lg px-4 bg-card border-b-0">
                                    <AccordionTrigger className="hover:no-underline py-4 [&[data-state=open]>svg]:rotate-180">
                                        <div className="flex items-center gap-4 text-start">
                                            <div className="bg-primary/10 text-primary h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                                                {idx + 1}
                                            </div>
                                            <span className="font-semibold text-lg">{section.title || t('course_details_section') + ' ' + (idx + 1)}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-4 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                                      <ul className="space-y-2 ps-12 pe-4" dir={direction}>
                                        {(section.lessons ?? []).map((lesson, lessonIdx) => (
                                          <li key={lesson.id} className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50 group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                                                    <PlayCircle className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium text-sm sm:text-base">{lesson.title}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <Badge variant="outline" className="font-normal bg-background">{t('preview')}</Badge>
                                                <span>12:45</span>
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            ) : (
                              <div className="text-center py-12 text-muted-foreground">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>{t('course_details_no_curriculum')}</p>
                              </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="faqs" className="animate-in slide-in-from-left-2 duration-300">
                    <Card className="border-none shadow-sm">
                        <CardContent className="p-6">
                            {course.faqs && course.faqs.length > 0 ? (
                                <Accordion type="single" collapsible className="w-full" dir={direction}>
                                    {course.faqs.map((faq, index) => (
                                        <AccordionItem key={index} value={`faq-${index}`}>
                                            <AccordionTrigger className="text-start font-medium">
                                                {faq.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-muted-foreground" dir="auto">
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4">
                                    <MessageCircle className="h-12 w-12 opacity-20" />
                                    <p>{t('course_details_no_faqs')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reviews" className="animate-in slide-in-from-left-2 duration-300">
                     <Card className="border-none shadow-sm">
                        <CardContent className="p-6">
                            {course.comments && course.comments.length > 0 ? (
                                <div className="space-y-4" dir={direction}>
                                    {course.comments.map((comment) => (
                                        <div key={comment.id} className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                                            <p className="text-sm text-muted-foreground mb-1">{comment.createAt}</p>
                                            <p className="text-foreground" dir="auto">{comment.content}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4">
                                    <MessageCircle className="h-12 w-12 opacity-20" />
                                    <p>{t('no_comments_placeholder')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
              </Tabs>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
            {/* Price Card */}
            <Card className="overflow-hidden border-t-4 border-t-primary shadow-lg">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="flex items-center justify-between">
                        <span className="text-muted-foreground text-base font-normal">{t('course_price')}</span>
                        <div className="flex items-baseline gap-1">
                            {course.price === 0 ? (
                                <span className="text-2xl font-bold text-green-600">{t('free')}</span>
                            ) : (
                                <>
                                    <span className="text-3xl font-bold text-primary">${course.price}</span>
                                    {/* <span className="text-sm text-muted-foreground line-through">$199</span> */}
                                </>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <Button className="w-full text-lg h-12 font-bold shadow-md hover:shadow-lg transition-all" size="lg">
                        {t('enroll_now')}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                        {t('money_back_guarantee')}
                    </p>
                </CardContent>
            </Card>

            {/* Course Specs */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg">{t('course_specs')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y">
                    <div className="flex justify-between py-3">
                        <span className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Clock className="h-4 w-4" /> {t('course_specs_duration')}
                        </span>
                        <span className="font-medium text-sm">{t('course_specs_hours')}</span>
                    </div>
                    <div className="flex justify-between py-3">
                        <span className="flex items-center gap-2 text-muted-foreground text-sm">
                            <MonitorPlay className="h-4 w-4" /> {t('course_specs_lessons')}
                        </span>
                        <span className="font-medium text-sm">
                            {course.sections?.reduce((acc, curr) => acc + (curr.lessons?.length ?? 0), 0) || 0}
                        </span>
                    </div>
                    <div className="flex justify-between py-3">
                        <span className="flex items-center gap-2 text-muted-foreground text-sm">
                            <BarChart className="h-4 w-4" /> {t('course_specs_level')}
                        </span>
                        <span className="font-medium text-sm">{course.level}</span>
                    </div>
                    <div className="flex justify-between py-3">
                        <span className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Globe className="h-4 w-4" /> {t('course_specs_language')}
                        </span>
                        <span className="font-medium text-sm">{course.language || t('language_en')}</span>
                    </div>
                    <div className="flex justify-between py-3">
                        <span className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Award className="h-4 w-4" /> {t('course_specs_certificate')}
                        </span>
                        <span className="font-medium text-sm">{course.degreeRequired ? t('yes') : t('no')}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Tags Card */}
            {course.tags && course.tags.length > 0 && (
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                             <Tag className="h-4 w-4" /> {t('addCourse_tags_title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {course.tags.map((tag, idx) => (
                             <Badge key={idx} variant="secondary" className="font-normal">
                                {tag}
                             </Badge>
                        ))}
                    </CardContent>
                </Card>
            )}
            
            {/* Instructor Card */}
             {instructor && (
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">{t('instructor')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                         <Avatar className="h-14 w-14 border-2 border-primary/10">
                          <AvatarImage src={instructor.avatarUrl} />
                          <AvatarFallback>{instructor.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-lg">{instructor.name}</p>
                          <p className="text-sm text-muted-foreground">Senior Developer</p>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 p-3 text-center">
                        <Button variant="link" className="w-full text-xs h-auto p-0 text-muted-foreground">
                            {t('view_profile')}
                        </Button>
                    </CardFooter>
                </Card>
             )}

            {/* Latest Courses (Mock Widget) */}
            <div className="space-y-4 pt-4">
                 <h4 className="font-bold text-lg px-1">{t('latest_courses')}</h4>
                 <div className="space-y-3">
                    {relatedCourses.map(rc => (
                        <Link href={`/dashboard/courses/${rc.id}`} key={rc.id} className="block group">
                            <Card className="flex gap-3 p-3 hover:bg-muted/50 transition-colors border-none shadow-sm">
                                <div className="relative h-16 w-24 shrink-0 rounded-md overflow-hidden bg-muted">
                                    {rc.thumbnailUrl ? (
                                        <Image
                                          src={toSameOriginAssetSrc(String(rc.thumbnailUrl)) ?? ''}
                                          alt={rc.title}
                                          fill
                                          className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full bg-secondary text-secondary-foreground text-xs">No Img</div>
                                    )}
                                </div>
                                <div className="flex flex-col justify-between py-0.5">
                                    <h5 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{rc.title}</h5>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {formatDate(rc.createdAt)}
                                    </span>
                                </div>
                            </Card>
                        </Link>
                    ))}
                 </div>
            </div>

        </div>
      </div>
      
      {/* Enrolled Students Section */}
      <Separator className="my-8" />
      <div className="space-y-6">
           <CourseEnrollmentsDashboard courseId={course.id} />
      </div>

    </div>
    
    {isEditModalOpen && (
        <CourseFormModal
            key={`edit-${course.id}`}
            open={isEditModalOpen}
            onOpenChangeAction={setIsEditModalOpen}
            course={course}
        />
    )}
    </>
  );
}
