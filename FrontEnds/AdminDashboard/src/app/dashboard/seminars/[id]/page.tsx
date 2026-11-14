'use client';

import * as React from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  MoreVertical,
  Tag,
  Users,
  DollarSign,
  Link as LinkIcon,
  BookOpen,
  MessageCircle,
  Star,
  ThumbsUp,
  HelpCircle,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useLanguage } from '@/components/language-provider';
import type { Seminar, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatAdminDate, formatAdminDateTime } from '@/lib/utils/localized-dates';
import SeminarDetailsLoading from './loading';
import { AddSeminarModal } from '../components/add-seminar-modal';
import {
  getSeminarById,
  getSeminarComments,
  getSeminarRegistrations,
  updateSeminarStatus,
  approveSeminarComment,
  type SeminarCommentItem,
  type SeminarRegistrationRow,
} from '@/services/seminar-api.service';
import { DefaultSeminarImage } from '@/components/seminar/default-seminar-image';
import { RichHtmlContent } from '@/components/shared/rich-html-content';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { resolveStaticAssetUrl } from '@/lib/apiClient';
import { getSeminarIntroStreamUrl, getSeminarRecordingStreamUrl } from '@/lib/api-config';

export default function SeminarDetailsPage() {
  const { t , locale } = useLanguage();
  const params = useParams();
  const seminarId = params.id as string;
  const [seminar, setSeminar] = React.useState<Seminar | null | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [comments, setComments] = React.useState<SeminarCommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = React.useState(false);
  const [participants, setParticipants] = React.useState<SeminarRegistrationRow[]>([]);
  const [participantsLoading, setParticipantsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!seminarId) {
      setSeminar(null);
      return;
    }
    let cancelled = false;
    setSeminar(undefined);
    getSeminarById(seminarId)
      .then((data) => {
        if (!cancelled) setSeminar(data ?? null);
      })
      .catch(() => {
        if (!cancelled) setSeminar(null);
      });
    return () => { cancelled = true; };
  }, [seminarId]);

  React.useEffect(() => {
    if (!seminarId) return;
    setCommentsLoading(true);
    getSeminarComments(seminarId, { onlyApproved: false })
      .then((r) => setComments(r.items))
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [seminarId]);

  React.useEffect(() => {
    if (!seminarId) return;
    setParticipantsLoading(true);
    getSeminarRegistrations(seminarId)
      .then((r) => setParticipants(r.items))
      .catch(() => setParticipants([]))
      .finally(() => setParticipantsLoading(false));
  }, [seminarId]);

  const refreshSeminar = () => {
    getSeminarById(seminarId).then((data) => data && setSeminar(data));
  };

  const handleEndSeminar = async () => {
    await updateSeminarStatus(Number(seminarId), 3);
    refreshSeminar();
  };

  const handleTogglePublic = async () => {
    if (!seminar) return;
    await updateSeminarStatus(Number(seminarId), seminar.statusNumeric ?? 1, !(seminar.isPublic ?? true));
    refreshSeminar();
  };

  const thumbnailSrc = seminar?.thumbnailUrl
    ? resolveStaticAssetUrl(seminar.thumbnailUrl)
    : null;
  const videoSrc = seminar?.videoUrl ? getSeminarIntroStreamUrl(seminar.id) : null;
  const recordingSrc =
    seminar?.hasRecording ? getSeminarRecordingStreamUrl(seminar.id) : null;

  if (seminar === undefined) {
    return <SeminarDetailsLoading />;
  }

  if (seminar === null) {
    notFound();
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/seminars">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">{t('back_to_seminars')}</span>
            </Link>
          </Button>
          <h1 className="text-xl font-bold tracking-tight xs:text-2xl">
            {seminar.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <div className="relative aspect-video w-full bg-muted">
                {thumbnailSrc ? (
                  <img
                    src={thumbnailSrc}
                    alt={seminar.title}
                    className="h-full w-full object-cover aspect-video"
                  />
                ) : (
                  <DefaultSeminarImage className="h-full w-full rounded-none" />
                )}
              </div>
              {seminar.videoUrl && videoSrc && (
                <div className="p-4 border-t">
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Video className="h-4 w-4" /> {t('seminar_video_intro') ?? 'ویدیو معرفی'}
                  </p>
                  <video src={videoSrc} controls className="w-full rounded-md max-h-[320px]" />
                </div>
              )}
              {seminar.hasRecording && recordingSrc && (
                <div className="p-4 border-t">
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Video className="h-4 w-4" /> Recorded seminar
                  </p>
                  <video src={recordingSrc} controls className="w-full rounded-md max-h-[320px]" />
                </div>
              )}
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <Badge
                    variant={
                      seminar.status === 'Upcoming'
                        ? 'default'
                        : seminar.status === 'Completed'
                          ? 'secondary'
                          : 'destructive'
                    }
                    className={cn(
                      seminar.status === 'Upcoming' && 'bg-accent text-accent-foreground'
                    )}
                  >
                    {t(seminar.status.toLowerCase())}
                  </Badge>
                  <CardTitle className="text-2xl mt-2">{seminar.title}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                      {t('actions_edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void handleTogglePublic()}>
                      {seminar.isPublic ? 'Hide from client site' : 'Publish on client site'}
                    </DropdownMenuItem>
                    {seminar.status !== 'Completed' && (
                      <DropdownMenuItem onClick={() => void handleEndSeminar()}>
                        End seminar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <RichHtmlContent
                  dir="auto"
                  className="prose dark:prose-invert max-w-full"
                  html={seminar.description}
                />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('seminar_details_title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{t('seminar_details_date')}</p>
                    <p className="text-muted-foreground">{formatAdminDate(seminar.date, locale)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{t('seminar_details_time')}</p>
                    <p className="text-muted-foreground">
                      {formatAdminDateTime(seminar.date, locale)}
                      {seminar.endTime ? ` – ${formatAdminDateTime(seminar.endTime, locale)}` : null}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{t('seminar_details_location')}</p>
                    <p className="text-muted-foreground">{seminar.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">{t('seminar_details_attendees')}</p>
                    <p className="text-muted-foreground">
                      {seminar.attendees.toLocaleString()}
                      {seminar.capacity != null && seminar.capacity > 0 && (
                        <span> / {seminar.capacity}</span>
                      )}
                    </p>
                  </div>
                </div>
                {(seminar.price != null || seminar.isFree !== undefined) && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{t('seminar_details_price') ?? 'قیمت'}</p>
                      <p className="text-muted-foreground">
                        {seminar.isFree || (seminar.price != null && Number(seminar.price) === 0)
                          ? (t('free') ?? 'رایگان')
                          : `${Number(seminar.price ?? 0).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                )}
                {(seminar.roomLink || seminar.entryLink) && (
                  <div className="flex items-start gap-3">
                    <LinkIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{t('seminar_details_link') ?? 'لینک ورود'}</p>
                      <p className="text-muted-foreground">
                        {seminar.roomLink || seminar.entryLink || '–'}
                      </p>
                    </div>
                  </div>
                )}
                {seminar.category && (
                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{t('seminar_details_category')}</p>
                      <p className="text-muted-foreground">{seminar.category}</p>
                    </div>
                  </div>
                )}
                {(seminar.tags?.length ?? 0) > 0 && (
                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1.5">
                      {seminar.tags!.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {seminar.prerequisites && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{t('seminar_prerequisites') ?? 'پیش‌نیازها'}</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">{seminar.prerequisites}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {(seminar.faqs?.length ?? 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" /> {t('seminar_faq_title') ?? 'سوالات متداول'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {seminar.faqs!.map((faq, idx) => (
                      <AccordionItem key={faq.id ?? idx} value={`faq-${idx}`}>
                        <AccordionTrigger className="text-left">{faq.question || t('faq_question')}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">{faq.answer || '–'}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Tabs dir={locale==='fa' ? 'rtl' : 'ltr'} defaultValue="participants" className="w-full">
          <TabsList>
            <TabsTrigger value="participants">{t('seminar_details_tab_participants')}</TabsTrigger>
            <TabsTrigger value="comments">
              {t('seminar_details_tab_comments') ?? 'نظرات'} ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">{t('seminar_details_tab_analytics')}</TabsTrigger>
          </TabsList>
          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle>{t('seminar_details_participants_title')}</CardTitle>
                <CardDescription>{t('seminar_details_participants_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {participantsLoading ? (
                  <p className="text-muted-foreground">{t('loading') ?? 'Loading...'}</p>
                ) : participants.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}}>{t('participants_table_col_name')}</TableHead>
                        <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}} className="hidden sm:table-cell">{t('participants_table_col_email')}</TableHead>
                        <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}}>{t('students_paid')}</TableHead>
                        <TableHead style={{textAlign: locale==='fa' ? 'right' : 'left'}} className="text-right">{t('participants_table_col_registered')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell>
                            <span className="font-medium">{participant.fullName.toString() || participant.email}</span>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{participant.email}</TableCell>
                          <TableCell>{participant.hasPaid ? 'Yes' : 'No'}</TableCell>
                          <TableCell className="text-right">{participant.registeredAt}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">{t('no_participants_placeholder')}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>{t('seminar_details_comments_title') ?? 'نظرات'}</CardTitle>
                <CardDescription>{t('seminar_details_comments_desc') ?? 'نظرات ثبت‌شده برای این سمینار'}</CardDescription>
              </CardHeader>
              <CardContent>
                {commentsLoading ? (
                  <p className="text-muted-foreground">{t('loading') ?? 'در حال بارگذاری...'}</p>
                ) : comments.length === 0 ? (
                  <p className="text-muted-foreground">{t('no_comments_placeholder') ?? 'هنوز نظری ثبت نشده است.'}</p>
                ) : (
                  <ul className="space-y-4">
                    {comments.filter((c) => !c.parentId).map((c) => (
                      <li key={c.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={c.author?.avatarUrl} />
                            <AvatarFallback>{(c.author?.fullName ?? '?').slice(0, 1)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{c.author?.fullName ?? t('anonymous')}</span>
                              {c.rating > 0 && (
                                <span className="flex items-center gap-0.5 text-sm text-muted-foreground">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {c.rating}
                                </span>
                              )}
                              {c.likes > 0 && (
                                <span className="flex items-center gap-0.5 text-sm text-muted-foreground">
                                  <ThumbsUp className="h-3.5 w-3.5" /> {c.likes}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{c.timeStamp}</p>
                            <p className="mt-1 text-sm">{c.text}</p>
                            <div className="mt-2 flex gap-2">
                              {!c.isApproved && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    approveSeminarComment(c.id, true).then(() =>
                                      getSeminarComments(seminarId, { onlyApproved: false }).then((r) =>
                                        setComments(r.items)
                                      )
                                    )
                                  }
                                >
                                  Approve
                                </Button>
                              )}
                            </div>
                            {c.replies?.length ? (
                              <ul className="mt-3 ml-4 space-y-2 border-l-2 pl-3">
                                {c.replies.map((r) => (
                                  <li key={r.id} className="flex items-start gap-2">
                                    <Avatar className="h-6 w-6 shrink-0">
                                      <AvatarImage src={r.author?.avatarUrl} />
                                      <AvatarFallback className="text-xs">{(r.author?.fullName ?? '?').slice(0, 1)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <span className="text-xs font-medium">{r.author?.fullName}</span>
                                      <p className="text-sm text-muted-foreground">{r.text}</p>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>{t('seminar_details_analytics_title')}</CardTitle>
                <CardDescription>{t('seminar_details_analytics_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('no_analytics_placeholder')}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {isEditModalOpen && (
        <AddSeminarModal
          open={isEditModalOpen}
          onOpenChangeAction={setIsEditModalOpen}
          seminar={seminar}
          onSuccessAction={() => {
            getSeminarById(seminarId).then((data) => data && setSeminar(data));
          }}
        />
      )}
    </>
  );
}
