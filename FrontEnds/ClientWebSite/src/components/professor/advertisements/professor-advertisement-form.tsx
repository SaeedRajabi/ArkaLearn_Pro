'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, PencilLine, Save, Eye } from 'lucide-react';
import { useAuthSessionReady } from '@/lib/hooks/use-auth-session-ready';
import { asLongId, isValidLongId } from '@/lib/id';
import { ProfessorAdRichTextEditor } from '@/components/ui/professor-ad-rich-text-editor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { uploadProfileImage } from '@/lib/api/account';
import {
  getTeacherAdvertisement,
  saveTeacherAdvertisement,
  type TeacherAdvertisement,
} from '@/lib/api/teacher-advertisements';
import { getMyAdvertisementPlan } from '@/lib/api/advertisement-monetization';
import { getApiErrorMessage } from '@/lib/api/client';
import { getDictValue } from '@/lib/i18n-client';
import { cn } from '@/lib/utils';
import {
  dedupeAdvertisementTags,
  getPlainTextLengthFromHtml,
  parseAdvertisementTags,
  tagsInputFromList,
} from '@/lib/utils/advertisement-limits';
import { validateAdvertisementContentPolicy } from '@/lib/utils/advertisement-content-policy';
import type { Dictionary } from '@/types';

type FormState = {
  title: string;
  privateTeachingCost: string;
  hourlyTeachingCost: string;
  workExperience: string;
  descriptionHtml: string;
  websiteUrl: string;
  websiteTitle: string;
  contactPhone: string;
  baleLink: string;
  telegramLink: string;
  whatsAppLink: string;
  gitHubLink: string;
  linkedInLink: string;
  infoAccuracyConfirmed: boolean;
  termsAccepted: boolean;
  tags: string;
};

const emptyForm = (): FormState => ({
  title: '',
  privateTeachingCost: '',
  hourlyTeachingCost: '',
  workExperience: '',
  descriptionHtml: '',
  websiteUrl: '',
  websiteTitle: '',
  contactPhone: '',
  baleLink: '',
  telegramLink: '',
  whatsAppLink: '',
  gitHubLink: '',
  linkedInLink: '',
  tags: '',
  infoAccuracyConfirmed: false,
  termsAccepted: false,
});

function mapAdToForm(ad: TeacherAdvertisement): FormState {
  return {
    title: ad.title,
    privateTeachingCost: ad.privateTeachingCost != null ? String(ad.privateTeachingCost) : '',
    hourlyTeachingCost: ad.hourlyTeachingCost != null ? String(ad.hourlyTeachingCost) : '',
    workExperience: ad.workExperience ?? '',
    descriptionHtml: ad.descriptionHtml,
    websiteUrl: ad.websiteUrl ?? '',
    websiteTitle: ad.websiteTitle ?? '',
    contactPhone: ad.contactPhone ?? '',
    baleLink: ad.baleLink ?? '',
    telegramLink: ad.telegramLink ?? '',
    whatsAppLink: ad.whatsAppLink ?? '',
    gitHubLink: ad.gitHubLink ?? '',
    linkedInLink: ad.linkedInLink ?? '',
    tags: (ad.tags ?? []).join(', '),
    infoAccuracyConfirmed: ad.infoAccuracyConfirmed,
    termsAccepted: ad.termsAccepted,
  };
}

export function ProfessorAdvertisementForm({
  dict,
  onExistingAdChange,
}: {
  dict: Dictionary;
  onExistingAdChange?: (hasExisting: boolean) => void;
}) {
  const { user, isReady: authReady, isBootstrapping: authBootstrapping, refetch: refetchAuth } =
    useAuthSessionReady();
  const { toast } = useToast();
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  const loadedIdentityRef = React.useRef<string | null>(null);
  const onExistingAdChangeRef = React.useRef(onExistingAdChange);
  onExistingAdChangeRef.current = onExistingAdChange;
  const [saving, setSaving] = React.useState(false);
  const [hasExistingAd, setHasExistingAd] = React.useState(false);
  const [approvalStatus, setApprovalStatus] = React.useState<string>('draft');
  const [rejectionNote, setRejectionNote] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [planMeta, setPlanMeta] = React.useState<{
    hasPaidFeatures?: boolean;
    freeMinTags?: number;
    freeMaxTags?: number;
    freeMaxWorkExperienceChars?: number;
    freeMaxVideos?: number;
    freeMaxBooks?: number;
    freeMaxArticles?: number;
    freeMaxDescriptionChars?: number;
  }>({});
  const [fieldErrors, setFieldErrors] = React.useState<{
    title?: string;
    tags?: string;
    workExperience?: string;
    description?: string;
    contentPolicy?: string;
  }>({});

  const t = (key: string, fallback: string) => getDictValue(dict, key, fallback);

  const loadAdvertisement = React.useCallback(async () => {
    const userName = user?.userName?.trim() || undefined;
    const hasIdentity = Boolean(userName || (user?.id && isValidLongId(asLongId(user.id))));
    if (!hasIdentity) {
      setHasExistingAd(false);
      setForm(emptyForm());
      onExistingAdChangeRef.current?.(false);
      return null;
    }
    const [ad, plan] = await Promise.all([
      getTeacherAdvertisement({
        userName,
        forEdit: true,
      }),
      getMyAdvertisementPlan(),
    ]);
    if (ad) {
      setForm(mapAdToForm(ad));
      setPlanMeta({
        hasPaidFeatures: plan?.hasPaidFeatures ?? ad.hasPaidFeatures,
        freeMinTags: plan?.freeMinTags ?? 3,
        freeMaxTags: plan?.freeMaxTags ?? 3,
        freeMaxWorkExperienceChars: plan?.freeMaxWorkExperienceChars ?? 1000,
        freeMaxVideos: plan?.freeMaxVideos ?? 1,
        freeMaxBooks: plan?.freeMaxBooks ?? 1,
        freeMaxArticles: plan?.freeMaxArticles ?? 1,
        freeMaxDescriptionChars: plan?.freeMaxDescriptionChars ?? 2000,
      });
      setFieldErrors({});
      setHasExistingAd(true);
      setApprovalStatus(ad.approvalStatus ?? 'draft');
      setRejectionNote(ad.rejectionNote ?? null);
      onExistingAdChangeRef.current?.(true);
    } else {
      setForm(emptyForm());
      setApprovalStatus('draft');
      setRejectionNote(null);
      setPlanMeta({
        hasPaidFeatures: plan?.hasPaidFeatures,
        freeMinTags: plan?.freeMinTags ?? 3,
        freeMaxTags: plan?.freeMaxTags ?? 3,
        freeMaxWorkExperienceChars: plan?.freeMaxWorkExperienceChars ?? 1000,
        freeMaxVideos: plan?.freeMaxVideos ?? 1,
        freeMaxBooks: plan?.freeMaxBooks ?? 1,
        freeMaxArticles: plan?.freeMaxArticles ?? 1,
        freeMaxDescriptionChars: plan?.freeMaxDescriptionChars ?? 2000,
      });
      setFieldErrors({});
      setHasExistingAd(false);
      onExistingAdChangeRef.current?.(false);
    }
    return ad;
  }, [user?.id, user?.userName]);

  const runInitialLoad = React.useCallback(async () => {
    if (!authReady) return;

    const identity = `${user?.id ?? ''}:${user?.userName ?? ''}`;
    if (!identity.replace(/:/g, '')) {
      setInitialLoading(false);
      return;
    }

    if (loadedIdentityRef.current === identity && hasLoadedOnce) {
      return;
    }

    loadedIdentityRef.current = identity;
    setInitialLoading(true);

    try {
      let lastError: unknown;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await loadAdvertisement();
          setHasLoadedOnce(true);
          return;
        } catch (error) {
          lastError = error;
          if (attempt < 2) {
            await refetchAuth();
            await new Promise((resolve) => window.setTimeout(resolve, 400 * (attempt + 1)));
          }
        }
      }
      throw lastError;
    } catch {
      toast({
        title: t('professorDashboard.advertisements.loadError', 'Failed to load advertisement'),
        variant: 'destructive',
      });
    } finally {
      setInitialLoading(false);
      setHasLoadedOnce(true);
    }
  }, [authReady, loadAdvertisement, refetchAuth, toast, user?.id, user?.userName]);

  React.useEffect(() => {
    if (!authReady) return;
    void runInitialLoad();
  }, [authReady, runInitialLoad]);

  React.useEffect(() => {
    if (!user?.id) {
      setHasLoadedOnce(false);
      loadedIdentityRef.current = null;
    }
  }, [user?.id]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isFreePlan = !planMeta.hasPaidFeatures;
  const parsedTags = React.useMemo(
    () => dedupeAdvertisementTags(parseAdvertisementTags(form.tags)),
    [form.tags]
  );
  const workCharCount = React.useMemo(() => form.workExperience.length, [form.workExperience]);
  const descriptionCharCount = React.useMemo(
    () => getPlainTextLengthFromHtml(form.descriptionHtml),
    [form.descriptionHtml]
  );

  const maxTags = planMeta.freeMaxTags ?? 3;
  const minTags = planMeta.freeMinTags ?? 3;
  const maxWorkChars = planMeta.freeMaxWorkExperienceChars ?? 1000;
  const maxDescriptionChars = planMeta.freeMaxDescriptionChars ?? 2000;

  const handleTagsChange = (raw: string) => {
    const tags = dedupeAdvertisementTags(parseAdvertisementTags(raw));
    if (isFreePlan && tags.length > maxTags) {
      const limited = tags.slice(0, maxTags);
      update('tags', tagsInputFromList(limited));
      setFieldErrors((prev) => ({
        ...prev,
        tags: t(
          'professorDashboard.advertisements.tagsMaxError',
          `You cannot add more than ${maxTags} tags on the free plan.`
        ).replace('{{max}}', String(maxTags)),
      }));
      return;
    }
    update('tags', raw);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.tags;
      return next;
    });
  };

  const handleWorkExperienceChange = (value: string) => {
    if (isFreePlan && value.length > maxWorkChars && value.length > form.workExperience.length) {
      setFieldErrors((prev) => ({
        ...prev,
        workExperience: t(
          'professorDashboard.advertisements.experienceMaxError',
          `You cannot enter more than ${maxWorkChars} characters.`
        ).replace('{{max}}', String(maxWorkChars)),
      }));
      return;
    }
    update('workExperience', value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (value.length <= maxWorkChars) {
        delete next.workExperience;
      } else {
        next.workExperience = t(
          'professorDashboard.advertisements.experienceReduceError',
          `Reduce work experience to ${maxWorkChars} characters or fewer before saving.`
        ).replace('{{max}}', String(maxWorkChars));
      }
      return next;
    });
  };

  const handleDescriptionChange = (html: string) => {
    const length = getPlainTextLengthFromHtml(html);
    const previousLength = getPlainTextLengthFromHtml(form.descriptionHtml);

    if (isFreePlan && length > maxDescriptionChars && length > previousLength) {
      setFieldErrors((prev) => ({
        ...prev,
        description: t(
          'professorDashboard.advertisements.descriptionMaxError',
          `You cannot add more than ${maxDescriptionChars} characters to the description.`
        ).replace('{{max}}', String(maxDescriptionChars)),
      }));
      return;
    }

    update('descriptionHtml', html);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (length <= maxDescriptionChars) {
        delete next.description;
      } else {
        next.description = t(
          'professorDashboard.advertisements.descriptionReduceError',
          `Reduce the description to ${maxDescriptionChars} characters or fewer before saving.`
        ).replace('{{max}}', String(maxDescriptionChars));
      }
      return next;
    });
  };

  const handleDescriptionLimitRejected = React.useCallback(() => {
    if (!isFreePlan) return;
    setFieldErrors((prev) => ({
      ...prev,
      description: t(
        'professorDashboard.advertisements.descriptionMaxError',
        `You cannot add more than ${maxDescriptionChars} characters to the description.`
      ).replace('{{max}}', String(maxDescriptionChars)),
    }));
  }, [isFreePlan, maxDescriptionChars, t]);

  const validateFreePlanLimits = (): boolean => {
    if (!isFreePlan) return true;

    const errors: typeof fieldErrors = {};
    if (parsedTags.length < minTags) {
      errors.tags = t(
        'professorDashboard.advertisements.tagsMinError',
        `Free plan requires at least ${minTags} tags.`
      ).replace('{{min}}', String(minTags));
    } else if (parsedTags.length > maxTags) {
      errors.tags = t(
        'professorDashboard.advertisements.tagsMaxError',
        `You cannot add more than ${maxTags} tags on the free plan.`
      ).replace('{{max}}', String(maxTags));
    }
    if (form.workExperience.trim().length > maxWorkChars) {
      errors.workExperience = t(
        'professorDashboard.advertisements.experienceReduceError',
        `Reduce work experience to ${maxWorkChars} characters or fewer before saving.`
      ).replace('{{max}}', String(maxWorkChars));
    }
    if (descriptionCharCount > maxDescriptionChars) {
      errors.description = t(
        'professorDashboard.advertisements.descriptionReduceError',
        `Reduce the description to ${maxDescriptionChars} characters or fewer before saving.`
      ).replace('{{max}}', String(maxDescriptionChars));
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    return true;
  };

  const validateContentPolicy = (): string | null => {
    const violation = validateAdvertisementContentPolicy({
      title: form.title,
      workExperience: form.workExperience,
      descriptionHtml: form.descriptionHtml,
      tags: parsedTags,
      messages: {
        phone: t(
          'professorDashboard.advertisements.contentPolicyPhone',
          'Do not include phone numbers in the ad text. Use the contact section only.'
        ),
        email: t(
          'professorDashboard.advertisements.contentPolicyEmail',
          'Do not include email addresses in the ad text.'
        ),
        url: t(
          'professorDashboard.advertisements.contentPolicyUrl',
          'Do not include website links or personal brand promotion in the ad text.'
        ),
        social: t(
          'professorDashboard.advertisements.contentPolicySocial',
          'Do not include social media links or handles in the ad text.'
        ),
        offPlatform: t(
          'professorDashboard.advertisements.contentPolicyOffPlatform',
          'The ad must only present your teaching skills on this platform.'
        ),
      },
    });

    if (!violation) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.contentPolicy;
        return next;
      });
      return null;
    }

    setFieldErrors((prev) => ({
      ...prev,
      contentPolicy: violation.message,
      ...(violation.field === 'title' ||
      violation.field === 'workExperience' ||
      violation.field === 'description' ||
      violation.field === 'tags'
        ? { [violation.field]: violation.message }
        : {}),
    }));
    return violation.message;
  };

  const handleSave = async () => {
    if (!user?.id) return;
    if (!form.title.trim()) {
      toast({ title: t('professorDashboard.advertisements.titleRequired', 'Title is required'), variant: 'destructive' });
      return;
    }
    if (!form.infoAccuracyConfirmed) {
      toast({
        title: t('professorDashboard.advertisements.accuracyRequired', 'Please confirm information accuracy'),
        variant: 'destructive',
      });
      return;
    }
    if (!form.termsAccepted) {
      toast({
        title: t('professorDashboard.advertisements.termsRequired', 'Please accept terms and conditions'),
        variant: 'destructive',
      });
      return;
    }
    if (!validateFreePlanLimits()) {
      toast({
        title: t('professorDashboard.advertisements.limitsError', 'Please fix the highlighted limits before saving.'),
        variant: 'destructive',
      });
      return;
    }
    const contentPolicyError = validateContentPolicy();
    if (contentPolicyError) {
      toast({
        title: t('professorDashboard.advertisements.contentPolicyError', 'Advertisement content is not allowed.'),
        description: contentPolicyError,
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await saveTeacherAdvertisement({
        userId: asLongId(user.id),
        title: form.title.trim(),
        privateTeachingCost: form.privateTeachingCost ? Number(form.privateTeachingCost) : null,
        hourlyTeachingCost: form.hourlyTeachingCost ? Number(form.hourlyTeachingCost) : null,
        workExperience: form.workExperience.trim(),
        descriptionHtml: form.descriptionHtml,
        websiteUrl: form.websiteUrl.trim(),
        websiteTitle: form.websiteTitle.trim(),
        contactPhone: form.contactPhone.trim(),
        baleLink: form.baleLink.trim(),
        telegramLink: form.telegramLink.trim(),
        whatsAppLink: form.whatsAppLink.trim(),
        gitHubLink: form.gitHubLink.trim(),
        linkedInLink: form.linkedInLink.trim(),
        infoAccuracyConfirmed: form.infoAccuracyConfirmed,
        termsAccepted: form.termsAccepted,
        tags: parsedTags,
      });
      setHasExistingAd(true);
      setApprovalStatus('pending');
      setRejectionNote(null);
      await loadAdvertisement();
      toast({
        title: t(
          'professorDashboard.advertisements.submittedForReview',
          'Advertisement saved and submitted for admin review.'
        ),
      });
    } catch (e) {
      const message = getApiErrorMessage(
        e,
        t('professorDashboard.advertisements.saveError', 'Failed to save advertisement')
      );
      setFieldErrors((prev) => ({ ...prev, contentPolicy: message }));
      toast({
        title: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const showInitialLoader = !hasLoadedOnce && (initialLoading || authBootstrapping);

  if (showInitialLoader) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasExistingAd && approvalStatus === 'pending' && (
        <Alert className="rounded-xl border-amber-500/40 bg-amber-500/5">
          <AlertDescription>
            {t(
              'professorDashboard.advertisements.pendingReviewBanner',
              'Your advertisement is waiting for admin approval and is not visible to the public yet.'
            )}
          </AlertDescription>
        </Alert>
      )}

      {hasExistingAd && approvalStatus === 'rejected' && (
        <Alert className="rounded-xl border-destructive/40 bg-destructive/5">
          <AlertDescription>
            {rejectionNote?.trim() ||
              t(
                'professorDashboard.advertisements.rejectedBanner',
                'Your advertisement was rejected by admin. Please update it and save again.'
              )}
          </AlertDescription>
        </Alert>
      )}

      {hasExistingAd && (
        <Alert className="rounded-xl border-primary/30 bg-primary/5">
          <AlertDescription>
            {t(
              'professorDashboard.advertisements.existingBanner',
              'You already have a teaching advertisement. You can edit it below and click update to save changes.'
            )}
          </AlertDescription>
        </Alert>
      )}

      {!planMeta.hasPaidFeatures && (
        <Alert className="rounded-xl border-amber-500/40 bg-amber-500/5">
          <AlertDescription className="space-y-2">
            <p>
              {t(
                'professorDashboard.adPlans.freeLimitsBanner',
                `Free plan: ${planMeta.freeMinTags ?? 3}–${planMeta.freeMaxTags ?? 3} tags, max ${planMeta.freeMaxWorkExperienceChars ?? 1000} work experience characters, max ${planMeta.freeMaxDescriptionChars ?? 2000} description characters, ${planMeta.freeMaxVideos ?? 1} video(s), up to ${planMeta.freeMaxBooks ?? 1} book(s) and ${planMeta.freeMaxArticles ?? 1} article(s).`
              )}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/professor/advertisement-plans">
                {t('professorDashboard.adPlans.viewPlans', 'View plans & upgrade')}
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Alert className="rounded-xl border-primary/30 bg-primary/5">
        <AlertDescription>
          {t(
            'professorDashboard.advertisements.contentPolicyNotice',
            'Write only about your teaching skills and experience. Do not put phone numbers, emails, website links, social media, or off-platform contact in the title, description, or experience fields. Contact details belong in the contact section below and are shown based on your plan.'
          )}
        </AlertDescription>
      </Alert>

      {fieldErrors.contentPolicy ? (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{fieldErrors.contentPolicy}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{t('professorDashboard.advertisements.basicInfo', 'Basic information')}</CardTitle>
          <CardDescription>
            {t('professorDashboard.advertisements.basicInfoDesc', 'Enter your teaching and project advertisement details.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ad-title">{t('professorDashboard.advertisements.title', 'Advertisement title')}</Label>
            <Input
              id="ad-title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder={t('professorDashboard.advertisements.titlePlaceholder', 'e.g. Private math tutoring')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="private-cost">{t('professorDashboard.advertisements.privateCost', 'Private teaching cost')}</Label>
              <Input
                id="private-cost"
                type="number"
                min={0}
                value={form.privateTeachingCost}
                onChange={(e) => update('privateTeachingCost', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourly-cost">{t('professorDashboard.advertisements.hourlyCost', 'Hourly teaching cost')}</Label>
              <Input
                id="hourly-cost"
                type="number"
                min={0}
                value={form.hourlyTeachingCost}
                onChange={(e) => update('hourlyTeachingCost', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="ad-tags">{t('professorDashboard.advertisements.tags', 'Tags (comma-separated)')}</Label>
              {isFreePlan ? (
                <span
                  className={cn(
                    'text-xs',
                    fieldErrors.tags || parsedTags.length > maxTags ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {parsedTags.length}/{maxTags}
                </span>
              ) : null}
            </div>
            <Input
              id="ad-tags"
              value={form.tags}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder={t('professorDashboard.advertisements.tagsPlaceholder', 'math, physics, programming')}
              className={cn(fieldErrors.tags && 'border-destructive ring-destructive/40')}
              aria-invalid={Boolean(fieldErrors.tags)}
            />
            {fieldErrors.tags ? (
              <p className="text-sm text-destructive" role="alert">
                {fieldErrors.tags}
              </p>
            ) : isFreePlan ? (
              <p className="text-xs text-muted-foreground">
                {t(
                  'professorDashboard.advertisements.tagsHint',
                  `Enter ${minTags} to ${maxTags} tags separated by commas.`
                )
                  .replace('{{min}}', String(minTags))
                  .replace('{{max}}', String(maxTags))}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="experience">{t('professorDashboard.advertisements.experience', 'Work experience')}</Label>
              {isFreePlan ? (
                <span
                  className={cn(
                    'text-xs',
                    fieldErrors.workExperience || workCharCount > maxWorkChars
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  )}
                >
                  {workCharCount}/{maxWorkChars}{' '}
                  {t('professorDashboard.advertisements.charsLabel', 'characters')}
                </span>
              ) : null}
            </div>
            <Textarea
              id="experience"
              rows={3}
              value={form.workExperience}
              onChange={(e) => handleWorkExperienceChange(e.target.value)}
              placeholder={t('professorDashboard.advertisements.experiencePlaceholder', 'Describe your teaching and project experience')}
              className={cn(fieldErrors.workExperience && 'border-destructive ring-destructive/40')}
              aria-invalid={Boolean(fieldErrors.workExperience)}
            />
            {fieldErrors.workExperience ? (
              <p className="text-sm text-destructive" role="alert">
                {fieldErrors.workExperience}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{t('professorDashboard.advertisements.description', 'Advertisement description')}</CardTitle>
          <CardDescription>
            {t('professorDashboard.advertisements.descriptionDesc', 'Use the rich editor to format text, images, tables, and more.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isFreePlan ? (
            <div className="flex justify-end">
              <span
                className={cn(
                  'text-xs',
                  fieldErrors.description || descriptionCharCount > maxDescriptionChars
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                )}
              >
                {descriptionCharCount}/{maxDescriptionChars}{' '}
                {t('professorDashboard.advertisements.charsLabel', 'characters')}
              </span>
            </div>
          ) : null}
          <ProfessorAdRichTextEditor
            value={form.descriptionHtml}
            onChange={handleDescriptionChange}
            onUploadImage={(file) => uploadProfileImage(file, { returnRelativePath: true })}
            placeholder={t('professorDashboard.advertisements.descriptionPlaceholder', 'Write your advertisement here...')}
            maxPlainTextLength={isFreePlan ? maxDescriptionChars : undefined}
            hasError={Boolean(fieldErrors.description)}
            limitErrorMessage={fieldErrors.description}
            onLimitRejected={handleDescriptionLimitRejected}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{t('professorDashboard.advertisements.contact', 'Contact & links')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website-title">{t('professorDashboard.advertisements.websiteTitle', 'Website title')}</Label>
              <Input id="website-title" value={form.websiteTitle} onChange={(e) => update('websiteTitle', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website-url">{t('professorDashboard.advertisements.websiteUrl', 'Website URL')}</Label>
              <Input id="website-url" type="url" value={form.websiteUrl} onChange={(e) => update('websiteUrl', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('professorDashboard.advertisements.phone', 'Contact phone')}</Label>
            <Input id="phone" value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bale">{t('professorDashboard.advertisements.bale', 'Bale group link')}</Label>
              <Input id="bale" value={form.baleLink} onChange={(e) => update('baleLink', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram">{t('professorDashboard.advertisements.telegram', 'Telegram link')}</Label>
              <Input id="telegram" value={form.telegramLink} onChange={(e) => update('telegramLink', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">{t('professorDashboard.advertisements.whatsapp', 'WhatsApp link')}</Label>
              <Input id="whatsapp" value={form.whatsAppLink} onChange={(e) => update('whatsAppLink', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">{t('professorDashboard.advertisements.github', 'GitHub link')}</Label>
              <Input id="github" value={form.gitHubLink} onChange={(e) => update('gitHubLink', e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="linkedin">{t('professorDashboard.advertisements.linkedin', 'LinkedIn link')}</Label>
              <Input id="linkedin" value={form.linkedInLink} onChange={(e) => update('linkedInLink', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{t('professorDashboard.advertisements.commitments', 'Commitments & visibility')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 rounded-lg border p-3">
            <Checkbox
              checked={form.infoAccuracyConfirmed}
              onCheckedChange={(v) => update('infoAccuracyConfirmed', v === true)}
            />
            <span className="text-sm leading-relaxed">
              {t(
                'professorDashboard.advertisements.accuracyCommitment',
                'I confirm that the information entered is accurate and I am responsible for any issues.'
              )}
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-lg border p-3">
            <Checkbox
              checked={form.termsAccepted}
              onCheckedChange={(v) => update('termsAccepted', v === true)}
            />
            <span className="text-sm leading-relaxed">
              {t(
                'professorDashboard.advertisements.termsCommitment',
                'I accept the site terms and conditions.'
              )}
            </span>
          </label>

          <div className="flex flex-wrap justify-end gap-2">
            {hasExistingAd ? (
              <Button type="button" variant="outline" asChild className="gap-2">
                <Link href="/professor/advertisements/preview">
                  <Eye className="h-4 w-4" />
                  {t('professorDashboard.advertisements.preview', 'Preview')}
                </Link>
              </Button>
            ) : null}
            <Button type="button" onClick={() => void handleSave()} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : hasExistingAd ? (
                <PencilLine className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {hasExistingAd
                ? t('professorDashboard.advertisements.update', 'Update advertisement')
                : t('professorDashboard.advertisements.save', 'Save advertisement')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
