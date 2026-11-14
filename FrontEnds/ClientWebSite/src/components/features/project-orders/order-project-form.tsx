'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, PhoneCall, Search, Rocket } from 'lucide-react';
import { getDictValue } from '@/lib/i18n-client';
import type { Dictionary } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { IconSelectPicker } from '@/components/shared/icon-select-picker';
import { submitProjectOrder } from '@/lib/api/project-orders';
import { getRegistrationSmsConfig, sendProjectOrderOtp, verifyProjectOrderOtp } from '@/lib/api/sms';
import { getApiErrorMessage } from '@/lib/api/client';
import { resolveRegistrationOtpError } from '@/lib/auth/registration-error-messages';
import { formatIranianMobileForApi, normalizeIranianMobile, toWesternDigits } from '@/lib/validation/registration';
import { OrderProjectMainCard, OrderProjectShell } from './order-project-shell';
import { OrderProjectSidebar } from './order-project-sidebar';
import {
  getProjectOrderTypeLabel,
  getProjectOrderTypeOptions,
  resolveFlowStep,
  type ProjectOrderTypeValue,
} from './project-order-types';

interface OrderProjectFormProps {
  dict: Dictionary;
  lang: 'en' | 'fa';
}

type Step = 'details' | 'otp' | 'subject';

function isValidIranianMobile(input: string): boolean {
  const formatted = formatIranianMobileForApi(input);
  return normalizeIranianMobile(formatted) !== null;
}

export function OrderProjectForm({ dict, lang }: OrderProjectFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('details');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [projectType, setProjectType] = useState<ProjectOrderTypeValue>('business');
  const [title, setTitle] = useState('');
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const t = (key: string, def: string) => getDictValue(dict, key, def);
  const isRtl = lang === 'fa';
  const registerDict = dict.register as Record<string, string | undefined> | undefined;
  const projectTypeOptions = useMemo(() => getProjectOrderTypeOptions(t), [dict]);
  const flowStep = resolveFlowStep(step, submitted, otpEnabled);
  const formattedPhoneDisplay = formatIranianMobileForApi(phone.trim()) || phone.trim();

  const sidebar = (
    <OrderProjectSidebar flowStep={flowStep} otpEnabled={otpEnabled} t={t} isRtl={isRtl} />
  );

  useEffect(() => {
    getRegistrationSmsConfig()
      .then((cfg) => setOtpEnabled(cfg.registrationOtpEnabled))
      .catch(() => setOtpEnabled(false));
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const resetFlow = () => {
    setStep('details');
    setFirstName('');
    setLastName('');
    setPhone('');
    setProjectType('business');
    setTitle('');
    setOtpSessionId('');
    setOtpCode('');
    setPhoneVerified(false);
    setCooldown(0);
    setFormError(null);
    setSubmitted(false);
  };

  const resolveOtpError = (error: unknown) =>
    resolveRegistrationOtpError(error, registerDict ?? {});

  const validateDetails = () => {
    if (firstName.trim().length < 2) {
      return t('projectOrder.validationFirstName', 'Please enter your first name.');
    }
    if (lastName.trim().length < 2) {
      return t('projectOrder.validationLastName', 'Please enter your last name.');
    }
    if (!isValidIranianMobile(phone.trim())) {
      return t('projectOrder.validationPhone', 'Please enter a valid phone number.');
    }
    return null;
  };

  const handleSendOtp = async () => {
    const validationError = validateDetails();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSendingOtp(true);
    setFormError(null);
    try {
      const session = await sendProjectOrderOtp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: formattedPhoneDisplay,
      });
      setOtpSessionId(session.sessionId);
      setCooldown(session.resendCooldownSeconds);
      setPhoneVerified(false);
      setOtpCode('');
      setStep('otp');
    } catch (error) {
      setFormError(resolveOtpError(error));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setFormError(t('projectOrder.otpRequired', 'Enter the verification code.'));
      return;
    }

    setVerifyingOtp(true);
    setFormError(null);
    try {
      await verifyProjectOrderOtp({
        sessionId: otpSessionId,
        phoneNumber: formattedPhoneDisplay,
        otpCode: otpCode.trim(),
      });
      setPhoneVerified(true);
      setStep('subject');
    } catch (error) {
      setFormError(resolveOtpError(error));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateDetails();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      setFormError(t('projectOrder.validationTitle', 'Please enter a project subject (at least 3 characters).'));
      return;
    }

    if (!projectType) {
      setFormError(t('projectOrder.validationProjectType', 'Please select a project type.'));
      return;
    }

    if (otpEnabled && !phoneVerified) {
      setFormError(t('projectOrder.otpRequired', 'Enter the verification code.'));
      setStep('otp');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await submitProjectOrder({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: formattedPhoneDisplay,
        title: trimmedTitle,
        projectType,
        otpSessionId: otpEnabled ? otpSessionId : undefined,
        otpCode: otpEnabled ? otpCode.trim() : undefined,
      });
      setSubmitted(true);
      toast({
        title: t('projectOrder.successTitle', 'Your project request has been submitted.'),
        description: t('projectOrder.successDescription', 'We will review it and contact you if needed.'),
      });
    } catch (error) {
      const message = getApiErrorMessage(error, t('projectOrder.errorDescription', 'Please try again.'));
      setFormError(message);
      toast({
        variant: 'destructive',
        title: t('projectOrder.errorTitle', 'Could not submit your request.'),
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetailsContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpEnabled) {
      await handleSendOtp();
      return;
    }
    setPhoneVerified(true);
    setStep('subject');
  };

  const isBusy = sendingOtp || verifyingOtp || submitting;

  const trackingSteps = [
    {
      icon: CheckCircle2,
      title: t('projectOrder.tracking.submittedTitle', 'Request submitted'),
      text: t('projectOrder.tracking.submittedText', 'Your request is registered in our system.'),
      active: true,
      done: true,
    },
    {
      icon: Search,
      title: t('projectOrder.tracking.reviewTitle', 'Expert review'),
      text: t('projectOrder.tracking.reviewText', 'Our team reviews scope and feasibility.'),
      active: true,
      done: false,
    },
    {
      icon: PhoneCall,
      title: t('projectOrder.tracking.contactTitle', 'We contact you'),
      text: t('projectOrder.tracking.contactText', 'If needed, we call or message you for clarification.'),
      active: false,
      done: false,
    },
    {
      icon: Rocket,
      title: t('projectOrder.tracking.startTitle', 'Project kickoff'),
      text: t('projectOrder.tracking.startText', 'After approval, planning and development begin.'),
      active: false,
      done: false,
    },
  ];

  if (submitted) {
    return (
      <OrderProjectShell sidebar={sidebar}>
        <OrderProjectMainCard className="space-y-8">
          <div className="flex flex-col items-center text-center sm:items-start sm:text-start">
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-600">
              <CheckCircle2 className="h-9 w-9" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t('projectOrder.successTitle', 'Your project request has been submitted.')}
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              {t('projectOrder.successDescription', 'We will review it and contact you if needed.')}
            </p>
          </div>

          <div className="rounded-xl border bg-muted/30 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('projectOrder.successSummaryLabel', 'Submitted request')}
            </p>
            <h2 className="mt-2 text-lg font-semibold">{title.trim()}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{getProjectOrderTypeLabel(projectType, t)}</Badge>
              <Badge variant="outline" dir="ltr">
                {formattedPhoneDisplay}
              </Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {firstName.trim()} {lastName.trim()}
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-base font-semibold">
              {t('projectOrder.trackingHeading', 'What happens next?')}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {trackingSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={`rounded-xl border p-4 ${item.done ? 'border-primary/30 bg-primary/5' : 'bg-background'}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t('projectOrder.successFollowUp', 'Keep your phone available — we may contact you about this request.')}
            </p>
            <Button type="button" variant="outline" onClick={resetFlow}>
              {t('projectOrder.submitAnother', 'Submit another request')}
            </Button>
          </div>
        </OrderProjectMainCard>
      </OrderProjectShell>
    );
  }

  if (step === 'otp') {
    return (
      <OrderProjectShell sidebar={sidebar}>
        <OrderProjectMainCard>
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t('projectOrder.otpTitle', 'Verify your phone number')}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t('projectOrder.otpSubtitle', 'Enter the code sent to {phone}').replace('{phone}', formattedPhoneDisplay)}
            </p>
          </div>

          <div className="space-y-6">
            {formError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="project-otp">{t('projectOrder.otpCodeLabel', 'Verification code')}</Label>
              <Input
                id="project-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(toWesternDigits(e.target.value).replace(/\D/g, ''))}
                placeholder="123456"
                dir="ltr"
                className="text-center text-lg tracking-widest"
              />
            </div>

            <Button type="button" className="w-full" disabled={isBusy} onClick={() => void handleVerifyOtp()}>
              {verifyingOtp
                ? t('projectOrder.otpVerifying', 'Verifying...')
                : t('projectOrder.otpConfirmButton', 'Confirm code')}
            </Button>

            <div className="flex flex-col items-center gap-2 text-sm">
              {cooldown > 0 ? (
                <span className="text-muted-foreground">
                  {t('projectOrder.otpResendWait', 'Resend available in {seconds}s').replace('{seconds}', String(cooldown))}
                </span>
              ) : (
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline disabled:opacity-50"
                  disabled={sendingOtp}
                  onClick={() => void handleSendOtp()}
                >
                  {t('projectOrder.otpResend', 'Resend code')}
                </button>
              )}
              <button
                type="button"
                className="text-muted-foreground hover:text-primary hover:underline"
                onClick={() => {
                  setStep('details');
                  setOtpCode('');
                  setPhoneVerified(false);
                  setFormError(null);
                }}
              >
                {t('projectOrder.changePhoneLink', 'Change phone number')}
              </button>
            </div>
          </div>
        </OrderProjectMainCard>
      </OrderProjectShell>
    );
  }

  if (step === 'subject') {
    return (
      <OrderProjectShell sidebar={sidebar}>
        <OrderProjectMainCard>
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t('projectOrder.subjectStepTitle', 'Project details')}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t('projectOrder.subjectStepSubtitle', 'Your phone number is verified. Select the project type and subject.')}
            </p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
            {formError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>
            )}

            <div className="rounded-xl border bg-muted/30 px-4 py-4 text-sm">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('projectOrder.contactSummary', 'Your contact info')}
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                <p>
                  <span className="text-muted-foreground">{t('projectOrder.firstName', 'First name')}:</span>{' '}
                  {firstName.trim()}
                </p>
                <p>
                  <span className="text-muted-foreground">{t('projectOrder.lastName', 'Last name')}:</span>{' '}
                  {lastName.trim()}
                </p>
                <p>
                  <span className="text-muted-foreground">{t('projectOrder.phone', 'Phone number')}:</span>{' '}
                  <span dir="ltr">{formattedPhoneDisplay}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-type">{t('projectOrder.projectType', 'Project type')}</Label>
              <IconSelectPicker
                id="project-type"
                value={projectType}
                onChange={(value) => setProjectType(value as ProjectOrderTypeValue)}
                options={projectTypeOptions}
                placeholder={t('projectOrder.projectTypePlaceholder', 'Select project type')}
                ariaLabel={t('projectOrder.projectType', 'Project type')}
                isRtl={isRtl}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-title">{t('projectOrder.projectTitle', 'Project subject')}</Label>
              <Input
                id="project-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('projectOrder.projectTitlePlaceholder', 'e.g. E-commerce website with admin panel')}
                maxLength={300}
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2 border-t pt-6 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={() => {
                  setStep(otpEnabled ? 'otp' : 'details');
                  setFormError(null);
                }}
              >
                {t('projectOrder.back', 'Back')}
              </Button>
              <Button type="submit" disabled={isBusy}>
                {submitting
                  ? t('projectOrder.submitting', 'Submitting...')
                  : t('projectOrder.submit', 'Submit request')}
              </Button>
            </div>
          </form>
        </OrderProjectMainCard>
      </OrderProjectShell>
    );
  }

  return (
    <OrderProjectShell sidebar={sidebar}>
      <OrderProjectMainCard>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t('projectOrder.title', 'Order a custom project')}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t(
              'projectOrder.subtitle',
              'Enter your contact details. We will send a verification code to your phone before you submit the request.'
            )}
          </p>
        </div>

        <form onSubmit={(e) => void handleDetailsContinue(e)} className="space-y-6">
          {formError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-first-name">{t('projectOrder.firstName', 'First name')}</Label>
              <Input
                id="project-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-last-name">{t('projectOrder.lastName', 'Last name')}</Label>
              <Input
                id="project-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-phone">{t('projectOrder.phone', 'Phone number')}</Label>
            <Input
              id="project-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(toWesternDigits(e.target.value))}
              autoComplete="tel"
              inputMode="numeric"
              placeholder={t('projectOrder.phonePlaceholder', '09xxxxxxxxx')}
              dir="ltr"
              required
            />
            <p className="text-xs text-muted-foreground">
              {t('projectOrder.phoneHint', 'Iranian mobile format, e.g. 09182767745')}
            </p>
          </div>

          <div className="flex justify-end border-t pt-6">
            <Button type="submit" disabled={isBusy}>
              {sendingOtp
                ? t('projectOrder.otpSending', 'Sending code...')
                : otpEnabled
                  ? t('projectOrder.sendOtpButton', 'Send verification code')
                  : t('projectOrder.continueButton', 'Continue')}
            </Button>
          </div>
        </form>
      </OrderProjectMainCard>
    </OrderProjectShell>
  );
}
