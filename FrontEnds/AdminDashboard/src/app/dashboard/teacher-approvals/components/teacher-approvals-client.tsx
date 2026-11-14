'use client';



import * as React from 'react';

import Image from 'next/image';

import { useSearchParams } from 'next/navigation';

import {

  CheckCircle2,

  Eye,

  GraduationCap,

  Loader2,

  RefreshCw,

  Sparkles,

  UserCheck,

  UserRound,

  XCircle,

} from 'lucide-react';

import { useLanguage } from '@/components/language-provider';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogFooter,

  DialogHeader,

  DialogTitle,

} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';

import { Skeleton } from '@/components/ui/skeleton';

import { ReviewChangesPanel, type TeacherReviewChanges } from '@/components/review-changes/review-changes-panel';

import { Textarea } from '@/components/ui/textarea';

import { useToast } from '@/hooks/use-toast';

import { formatLocalizedDateTime } from '@/lib/utils/localized-ui';
import { resolveStaticAssetUrl } from '@/lib/api-config';
import { resolveDegreeImageUrl } from '@/lib/default-certificate-image';

import * as teacherApi from '@/services/teacher-service';



function degreeLabel(t: (key: string, params?: Record<string, string>) => string, degreeType: string) {

  const normalized = (degreeType || 'bachelors').toLowerCase();

  if (normalized === 'masters' || normalized === 'master') return t('teacher_approvals_degree_masters');

  if (normalized === 'phd' || normalized === 'ph_d') return t('teacher_approvals_degree_phd');

  if (normalized === 'certificate' || normalized === 'work') return t('teacher_approvals_degree_certificate');

  return t('teacher_approvals_degree_bachelors');

}



export function TeacherApprovalsClient() {

  const { t, locale } = useLanguage();

  const { toast } = useToast();

  const searchParams = useSearchParams();

  const [items, setItems] = React.useState<teacherApi.PendingTeacherProfileDto[]>([]);

  const [loading, setLoading] = React.useState(true);

  const [refreshing, setRefreshing] = React.useState(false);

  const [actingId, setActingId] = React.useState<number | null>(null);

  const [selectedItem, setSelectedItem] = React.useState<teacherApi.PendingTeacherProfileDto | null>(null);

  const [profileDetail, setProfileDetail] = React.useState<teacherApi.TeacherProfileDto | null>(null);

  const [profileLoading, setProfileLoading] = React.useState(false);

  const [rejectionNote, setRejectionNote] = React.useState('');

  const [reviewChanges, setReviewChanges] = React.useState<TeacherReviewChanges | null>(null);

  const [reviewChangesLoading, setReviewChangesLoading] = React.useState(false);

  const [categories, setCategories] = React.useState<Array<{ id: number; name: string }>>([]);

  const deepLinkHandled = React.useRef(false);



  const load = React.useCallback(async (silent = false) => {

    if (silent) setRefreshing(true);

    else setLoading(true);

    try {

      setItems(await teacherApi.getPendingTeacherProfiles());

    } catch (error) {

      const status = (error as { response?: { status?: number } })?.response?.status;

      toast({

        title: status === 403 ? t('teacher_approvals_access_denied') : t('teacher_approvals_load_failed'),

        description:

          status === 403

            ? t('teacher_approvals_access_denied_desc')

            : t('teacher_approvals_load_failed_desc'),

        variant: 'destructive',

      });

      setItems([]);

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  }, [t, toast]);



  React.useEffect(() => {

    void load();

    void teacherApi.getTeachingCategories().then(setCategories).catch(() => setCategories([]));

  }, [load]);



  const openDetail = React.useCallback(

    async (item: teacherApi.PendingTeacherProfileDto) => {

      setSelectedItem(item);

      setProfileDetail(null);

      setReviewChanges(null);

      setRejectionNote('');

      setProfileLoading(true);

      setReviewChangesLoading(true);

      try {

        const [profile, changes] = await Promise.all([

          teacherApi.getTeacherProfile({ userName: item.userName, forEdit: true }),

          teacherApi.getTeacherReviewChanges({ reviewType: 'profile', teacherId: item.teacherId }),

        ]);

        setProfileDetail(profile);

        setReviewChanges(changes);

      } catch {

        toast({ title: t('teacher_approvals_profile_load_failed'), variant: 'destructive' });

        setSelectedItem(null);

      } finally {

        setProfileLoading(false);

        setReviewChangesLoading(false);

      }

    },

    [t, toast]

  );



  React.useEffect(() => {

    if (deepLinkHandled.current || loading || items.length === 0) return;

    const teacherIdParam = searchParams.get('teacherId');

    if (!teacherIdParam) return;

    const teacherId = Number(teacherIdParam);

    if (!teacherId) return;

    const match = items.find((item) => item.teacherId === teacherId);

    if (match) {

      deepLinkHandled.current = true;

      void openDetail(match);

    }

  }, [items, loading, openDetail, searchParams]);



  const closeDetail = () => {

    setSelectedItem(null);

    setProfileDetail(null);

    setReviewChanges(null);

    setRejectionNote('');

  };



  const review = async (teacherId: number, approve: boolean, note?: string) => {

    if (!approve && !note?.trim()) {

      toast({ title: t('teacher_approvals_rejection_required'), variant: 'destructive' });

      return;

    }

    setActingId(teacherId);

    try {

      await teacherApi.reviewTeacherProfile({

        teacherId,

        approve,

        rejectionNote: note?.trim(),

      });

      toast({

        title: approve ? t('teacher_approvals_approved_toast') : t('teacher_approvals_rejected_toast'),

      });

      closeDetail();

      await load(true);

    } catch {

      toast({ title: t('teacher_approvals_action_failed'), variant: 'destructive' });

    } finally {

      setActingId(null);

    }

  };



  const categoryName =

    profileDetail?.teachingCategoryId != null

      ? categories.find((c) => c.id === profileDetail.teachingCategoryId)?.name

      : selectedItem?.teachingCategoryName;



  const busy = selectedItem ? actingId === selectedItem.teacherId : false;

  const changedFieldKeys = React.useMemo(

    () => new Set((reviewChanges?.changes ?? []).map((change) => change.fieldKey)),

    [reviewChanges]

  );

  const showField = (fieldKey: string) =>

    !reviewChanges?.hasApprovedBaseline || changedFieldKeys.size === 0 || changedFieldKeys.has(fieldKey);

  const reviewFieldLabel = (fieldKey: string, fallback: string) => {

    const key = `teacher_review_field_${fieldKey}` as const;

    const translated = t(key);

    return translated === key ? fallback : translated;

  };



  return (

    <div className="space-y-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">

            <UserCheck className="h-6 w-6" />

          </div>

          <div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('teacher_approvals_title')}</h1>

            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('teacher_approvals_description')}</p>

          </div>

        </div>

        <div className="flex items-center gap-2 self-start">

          {!loading && (

            <Badge variant="secondary" className="px-3 py-1 text-sm">

              {t('teacher_approvals_pending_count', { count: String(items.length) })}

            </Badge>

          )}

          <Button variant="outline" size="sm" disabled={loading || refreshing} onClick={() => void load(true)}>

            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}

            <span className="ms-2">{t('refresh')}</span>

          </Button>

        </div>

      </div>



      {loading ? (

        <div className="grid gap-4">

          {Array.from({ length: 3 }).map((_, i) => (

            <Card key={i}>

              <CardHeader>

                <Skeleton className="h-6 w-48" />

                <Skeleton className="h-4 w-72" />

              </CardHeader>

              <CardContent>

                <Skeleton className="h-10 w-56" />

              </CardContent>

            </Card>

          ))}

        </div>

      ) : items.length === 0 ? (

        <Card className="border-dashed">

          <CardContent className="flex flex-col items-center justify-center py-16 text-center">

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">

              <UserRound className="h-8 w-8 text-muted-foreground" />

            </div>

            <h2 className="text-lg font-semibold">{t('teacher_approvals_empty_title')}</h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('teacher_approvals_empty_desc')}</p>

          </CardContent>

        </Card>

      ) : (

        <div className="grid gap-4">

          {items.map((item) => {

            const itemBusy = actingId === item.teacherId;

            return (

              <Card key={item.teacherId} className="overflow-hidden transition-shadow hover:shadow-md">

                <CardHeader className="border-b bg-muted/20 pb-4">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div className="flex items-start gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">

                        <UserRound className="h-5 w-5" />

                      </div>

                      <div>

                        <CardTitle className="text-lg">{item.displayName}</CardTitle>

                        <CardDescription className="mt-1">

                          @{item.userName}

                          {item.teachingCategoryName ? ` · ${item.teachingCategoryName}` : ''}

                        </CardDescription>

                      </div>

                    </div>

                    <Badge variant="outline">{t('teacher_approvals_status_pending')}</Badge>

                  </div>

                </CardHeader>

                <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">

                  <dl className="grid gap-2 text-sm sm:grid-cols-2">

                    <div>

                      <dt className="text-muted-foreground">{t('teacher_approvals_teacher_id')}</dt>

                      <dd className="font-medium">{item.teacherId}</dd>

                    </div>

                    {item.submittedAtUtc ? (

                      <div>

                        <dt className="text-muted-foreground">{t('teacher_approvals_submitted_at')}</dt>

                        <dd className="font-medium">{formatLocalizedDateTime(item.submittedAtUtc, locale, t)}</dd>

                      </div>

                    ) : null}

                  </dl>

                  <div className="flex flex-wrap gap-2">

                    <Button variant="secondary" disabled={itemBusy} onClick={() => void openDetail(item)}>

                      <Eye className="h-4 w-4" />

                      <span className="ms-2">{t('teacher_approvals_view_details')}</span>

                    </Button>

                  </div>

                </CardContent>

              </Card>

            );

          })}

        </div>

      )}



      <Dialog open={selectedItem != null} onOpenChange={(open) => !open && closeDetail()}>

        <DialogContent className="flex max-h-[min(92vh,920px)] w-[min(96vw,48rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">

          <DialogHeader className="shrink-0 space-y-1 border-b bg-muted/20 px-6 py-5 text-start">

            <DialogTitle>{t('teacher_approvals_detail_title')}</DialogTitle>

            <DialogDescription>

              {selectedItem

                ? `${selectedItem.displayName} (@${selectedItem.userName})`

                : t('teacher_approvals_description')}

            </DialogDescription>

          </DialogHeader>



          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">

            {profileLoading ? (

              <div className="space-y-4 py-4">

                <Skeleton className="h-32 w-full rounded-lg" />

                <Skeleton className="h-4 w-full" />

                <Skeleton className="h-4 w-3/4" />

                <Skeleton className="h-24 w-full" />

              </div>

            ) : profileDetail ? (

              <div className="space-y-6">

                <ReviewChangesPanel

                  changes={reviewChanges}

                  loading={reviewChangesLoading}

                  emptyLabel={t('teacher_review_no_changes')}

                  newContentLabel={t('teacher_review_new_content')}

                  noBaselineLabel={t('teacher_review_first_submission')}

                  changesTitle={t('teacher_review_changes_title')}

                  fieldLabel={reviewFieldLabel}

                />

                {showField('headerImageUrl') && profileDetail.headerImageUrl ? (

                  <div className="relative h-44 w-full overflow-hidden rounded-xl border bg-muted shadow-sm">

                    {/* eslint-disable-next-line @next/next/no-img-element */}

                    <img

                      src={resolveStaticAssetUrl(profileDetail.headerImageUrl)}

                      alt=""

                      className="h-full w-full object-cover"

                    />

                  </div>

                ) : null}



                <div className="flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm">

                  {profileDetail.avatarUrl ? (

                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-background shadow-md">

                      <Image

                        src={resolveStaticAssetUrl(profileDetail.avatarUrl)}

                        alt=""

                        fill

                        className="object-cover"

                        unoptimized

                      />

                    </div>

                  ) : (

                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">

                      <UserRound className="h-8 w-8" />

                    </div>

                  )}

                  <div className="min-w-0 flex-1 space-y-1">

                    <p className="text-lg font-semibold">{profileDetail.displayName}</p>

                    <p className="text-sm text-muted-foreground">@{profileDetail.userName}</p>

                    {profileDetail.headline ? (

                      <p className="text-sm">{profileDetail.headline}</p>

                    ) : null}

                  </div>

                </div>



                <dl className="grid gap-3 text-sm sm:grid-cols-2">

                  {showField('teachingCategoryId') && categoryName ? (

                    <div>

                      <dt className="text-muted-foreground">{t('teacher_approvals_teaching_category')}</dt>

                      <dd className="font-medium">{categoryName}</dd>

                    </div>

                  ) : null}

                  {selectedItem?.submittedAtUtc ? (

                    <div>

                      <dt className="text-muted-foreground">{t('teacher_approvals_submitted_at')}</dt>

                      <dd className="font-medium">

                        {formatLocalizedDateTime(selectedItem.submittedAtUtc, locale, t)}

                      </dd>

                    </div>

                  ) : null}

                </dl>



                {showField('shortDescription') && profileDetail.shortDescription ? (

                  <section className="space-y-2 rounded-xl border bg-card p-4">

                    <h3 className="text-sm font-semibold">{t('teacher_approvals_short_desc')}</h3>

                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">

                      {profileDetail.shortDescription}

                    </p>

                  </section>

                ) : null}



                {showField('longDescription') && profileDetail.longDescription ? (

                  <section className="space-y-2 rounded-xl border bg-card p-4">

                    <h3 className="text-sm font-semibold">{t('teacher_approvals_long_desc')}</h3>

                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">

                      {profileDetail.longDescription}

                    </p>

                  </section>

                ) : null}



                {showField('educations') && profileDetail.educations.length > 0 ? (

                  <section className="space-y-3">

                    <h3 className="flex items-center gap-2 text-sm font-semibold">

                      <GraduationCap className="h-4 w-4" />

                      {t('teacher_approvals_educations')}

                    </h3>

                    <div className="space-y-3">

                      {profileDetail.educations.map((edu) => (

                        <div key={edu.id} className="flex gap-3 rounded-lg border p-3">

                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">

                            {/* eslint-disable-next-line @next/next/no-img-element */}

                            <img
                              src={resolveDegreeImageUrl(edu.degreeImage)}
                              alt=""
                              className="h-full w-full object-contain p-1"
                            />

                          </div>

                          <div>

                            <p className="font-medium">{edu.universityName}</p>

                            <p className="text-sm text-muted-foreground">

                              {degreeLabel(t, edu.degreeType)}

                            </p>

                          </div>

                        </div>

                      ))}

                    </div>

                  </section>

                ) : null}



                {showField('skills') && profileDetail.skills.length > 0 ? (

                  <section className="space-y-3">

                    <h3 className="flex items-center gap-2 text-sm font-semibold">

                      <Sparkles className="h-4 w-4" />

                      {t('teacher_approvals_skills')}

                    </h3>

                    <div className="flex flex-wrap gap-2">

                      {profileDetail.skills.map((skill) => (

                        <Badge key={skill.id} variant="secondary" className="px-3 py-1">

                          {skill.name}

                          <span className="ms-2 text-muted-foreground">({skill.rate}/10)</span>

                        </Badge>

                      ))}

                    </div>

                  </section>

                ) : null}

              </div>

            ) : null}

          </div>



          <div className="shrink-0 space-y-4 border-t bg-muted/20 px-6 py-4">

            <div className="space-y-2">

              <Label htmlFor="rejection-note">{t('teacher_approvals_rejection_note')}</Label>

              <Textarea

                id="rejection-note"

                value={rejectionNote}

                onChange={(e) => setRejectionNote(e.target.value)}

                placeholder={t('teacher_approvals_rejection_placeholder')}

                rows={2}

              />

            </div>



            <DialogFooter className="gap-3 p-0 sm:flex-row sm:items-center sm:justify-between">

            <Button variant="ghost" onClick={closeDetail} disabled={busy}>

              {t('teacher_approvals_close')}

            </Button>

            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">

              <Button

                variant="outline"

                disabled={busy || !selectedItem || profileLoading}

                onClick={() => selectedItem && void review(selectedItem.teacherId, false, rejectionNote)}

              >

                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}

                <span className="ms-2">{t('teacher_approvals_reject')}</span>

              </Button>

              <Button

                disabled={busy || !selectedItem || profileLoading}

                onClick={() => selectedItem && void review(selectedItem.teacherId, true)}

              >

                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}

                <span className="ms-2">{t('teacher_approvals_approve')}</span>

              </Button>

            </div>

          </DialogFooter>

          </div>

        </DialogContent>

      </Dialog>

    </div>

  );

}

