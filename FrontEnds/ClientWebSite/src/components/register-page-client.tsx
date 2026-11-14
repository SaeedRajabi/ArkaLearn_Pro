'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { Lock, Mail, User, Eye, EyeOff, Phone, AtSign, GraduationCap, BookOpen } from 'lucide-react';
import { Logo } from './logo';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FacebookIcon } from './icons/facebook-icon';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { register as apiRegister, USER_ROLE_STUDENT, USER_ROLE_TEACHER } from '@/lib/api/account';
import { getRegistrationSmsConfig, sendRegistrationOtp } from '@/lib/api/sms';
import { ApiError } from '@/lib/api/client';
import { resolveRegistrationOtpError } from '@/lib/auth/registration-error-messages';
import { postAuthNavigate } from '@/lib/auth/post-auth-navigate';
import { resolvePostLoginPath } from '@/lib/auth/roles';
import { createRegisterFormSchema } from '@/lib/validation/registration';
import { useAuth } from '@/contexts/auth-context';
import { normalizeLoginIdentifier } from '@/lib/validation/login';

interface RegisterPageClientProps {
  dict: Record<string, string>;
}

type Step = 'details' | 'otp';

export function RegisterPageClient({ dict }: RegisterPageClientProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('details');
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const { login: doLogin, setSessionFromUserData } = useAuth();

  const formSchema = createRegisterFormSchema({
    fullNameRequired: dict.nameRequired,
    userNameRequired: dict.userNameRequired,
    userNameEnglish: dict.userNameEnglish,
    emailRequired: dict.emailRequired,
    emailEnglish: dict.emailEnglish,
    phoneRequired: dict.phoneRequired,
    phoneInvalid: dict.phoneInvalid,
    passwordRequired: dict.passwordRequired,
    confirmPasswordMatch: dict.confirmPasswordMatch,
    termsRequired: dict.termsRequired,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      userName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      terms: false,
      accountType: 'student' as 'student' | 'professor',
    },
  });

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

  async function completeRegistration(values: z.infer<typeof formSchema>, sessionId?: string, code?: string) {
    const registerResult = await apiRegister({
      userName: values.userName.trim(),
      fullName: values.fullName.trim(),
      email: values.email.trim().toLowerCase(),
      phoneNumber: values.phoneNumber.trim(),
      password: values.password,
      userRole: values.accountType === 'professor' ? USER_ROLE_TEACHER : USER_ROLE_STUDENT,
      acceptedTerms: true,
      otpSessionId: sessionId,
      otpCode: code,
    });

    const emailLogin = normalizeLoginIdentifier(values.email);
    const signedInFromRegister = setSessionFromUserData(
      registerResult.userData as Record<string, unknown> | undefined
    );

    if (!signedInFromRegister) {
      const loginRes = await doLogin({
        userNameOrEmail: emailLogin,
        password: values.password,
      });
      if (!loginRes?.userData) {
        throw new Error(dict.autoLoginFailed ?? 'Account created but sign-in failed. Please log in.');
      }
    }

    const role =
      (registerResult.userData as Record<string, unknown> | undefined)?.Role ??
      (registerResult.userData as Record<string, unknown> | undefined)?.role ??
      (values.accountType === 'professor' ? '2' : '1');
    setIsRedirecting(true);
    postAuthNavigate(
      router,
      resolvePostLoginPath(
        role != null ? String(role) : null,
        null
      )
    );
  }

  async function sendOtpForCurrentForm(values: z.infer<typeof formSchema>) {
    setSendingOtp(true);
    setSubmitError(null);
    try {
      const session = await sendRegistrationOtp({
        userName: values.userName.trim(),
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        phoneNumber: values.phoneNumber.trim(),
      });
      setOtpSessionId(session.sessionId);
      setCooldown(session.resendCooldownSeconds);
      setStep('otp');
    } catch (err) {
      setSubmitError(resolveRegistrationOtpError(err, dict));
    } finally {
      setSendingOtp(false);
    }
  }

  async function onSubmitDetails(values: z.infer<typeof formSchema>) {
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (otpEnabled) {
        await sendOtpForCurrentForm(values);
        return;
      }
      await completeRegistration(values);
    } catch (err) {
      setSubmitError(resolveRegistrationOtpError(err, dict));
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitOtp() {
    setSubmitError(null);
    if (!otpCode.trim()) {
      setSubmitError(dict.otpRequired ?? 'Enter the verification code.');
      return;
    }
    setSubmitting(true);
    try {
      const values = form.getValues();
      await completeRegistration(values, otpSessionId, otpCode.trim());
    } catch (err) {
      setSubmitError(resolveRegistrationOtpError(err, dict));
    } finally {
      setSubmitting(false);
    }
  }

  const isBusy = submitting || sendingOtp || isRedirecting;

  const values = form.watch();

  if (step === 'otp') {
    return (
      <>
        <div className="text-center">
          <div className="mb-4 hidden justify-center lg:flex">
            <Logo />
          </div>
          <h1 className="text-3xl font-bold font-headline">{dict.otpTitle ?? 'Verify your phone'}</h1>
          <p className="mt-2 text-muted-foreground">
            {(dict.otpSubtitle ?? 'Enter the code sent to {phone}').replace('{phone}', values.phoneNumber)}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {submitError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{submitError}</div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">{dict.otpCodeLabel ?? 'Verification code'}</label>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              dir="ltr"
              className="text-center text-lg tracking-widest"
            />
          </div>

          <Button
            type="button"
            className="w-full"
            loading={isBusy}
            loadingText={dict.loadingText}
            disabled={isBusy}
            onClick={() => void onSubmitOtp()}
          >
            {dict.otpConfirmButton ?? 'Confirm and register'}
          </Button>

          <div className="flex flex-col items-center gap-2 text-sm">
            {cooldown > 0 ? (
              <span className="text-muted-foreground">
                {(dict.otpResendWait ?? 'Resend available in {seconds}s').replace('{seconds}', String(cooldown))}
              </span>
            ) : (
              <button
                type="button"
                className="font-semibold text-primary hover:underline disabled:opacity-50"
                disabled={sendingOtp}
                onClick={() => void sendOtpForCurrentForm(form.getValues())}
              >
                {dict.otpResend ?? 'Resend code'}
              </button>
            )}
            <button
              type="button"
              className="text-muted-foreground hover:text-primary hover:underline"
              onClick={() => {
                setStep('details');
                setOtpCode('');
                setSubmitError(null);
              }}
            >
              {dict.changePhoneLink ?? 'Change contact number'}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="text-center">
        <div className="mb-4 hidden justify-center lg:flex">
          <Logo />
        </div>
        <h1 className="text-3xl font-bold font-headline">{dict.title}</h1>
        <p className="mt-2 text-muted-foreground">{dict.subtitle}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitDetails)} className="mt-8 space-y-6">
          {submitError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </div>
          )}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict.nameLabel}</FormLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:right-3 rtl:left-auto" />
                  <FormControl>
                    <Input placeholder={dict.fullNamePlaceholder} className="pl-10 rtl:pr-10" autoComplete="name" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict.accountTypeLabel ?? 'Account type'}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                  >
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:border-primary">
                      <RadioGroupItem value="student" />
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{dict.accountTypeStudent ?? 'Student'}</p>
                        <p className="text-xs text-muted-foreground">{dict.accountTypeStudentDesc ?? 'Learn courses and seminars'}</p>
                      </div>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:border-primary">
                      <RadioGroupItem value="professor" />
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{dict.accountTypeProfessor ?? 'Professor'}</p>
                        <p className="text-xs text-muted-foreground">{dict.accountTypeProfessorDesc ?? 'Create your public teacher profile'}</p>
                      </div>
                    </label>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict.userNameLabel}</FormLabel>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:right-3 rtl:left-auto" />
                  <FormControl>
                    <Input placeholder={dict.userNamePlaceholder} className="pl-10 rtl:pr-10" dir="ltr" autoComplete="username" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict.emailLabel}</FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:right-3 rtl:left-auto" />
                  <FormControl>
                    <Input type="email" placeholder="name@example.com" className="pl-10 rtl:pr-10" dir="ltr" autoComplete="email" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict.phoneLabel}</FormLabel>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:right-3 rtl:left-auto" />
                  <FormControl>
                    <Input type="tel" placeholder="09182767745" className="pl-10 rtl:pr-10" dir="ltr" autoComplete="tel" inputMode="numeric" {...field} />
                  </FormControl>
                </div>
                <p className="text-xs text-muted-foreground">{dict.phoneHint}</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict.passwordLabel}</FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:right-3 rtl:left-auto" />
                  <FormControl>
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 rtl:pr-10 rtl:pl-10" autoComplete="new-password" {...field} />
                  </FormControl>
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:bg-transparent rtl:left-2 rtl:right-auto" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict.confirmPasswordLabel}</FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:right-3 rtl:left-auto" />
                  <FormControl>
                    <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 rtl:pr-10 rtl:pl-10" autoComplete="new-password" {...field} />
                  </FormControl>
                  <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:bg-transparent rtl:left-2 rtl:right-auto" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem className="flex items-start space-x-2 space-y-0 rtl:space-x-reverse">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
                </FormControl>
                <div className="grid gap-1.5 leading-none">
                  <FormLabel className="font-normal">
                    {dict.terms}{' '}
                    <Dialog>
                      <DialogTrigger asChild>
                        <span className="cursor-pointer font-semibold text-primary hover:underline">{dict.termsLink}</span>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>{dict.termsDialogTitle}</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-96 rounded-md border p-4">
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{dict.termsDialogContent}</p>
                        </ScrollArea>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button">{dict.termsDialogClose}</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>{' '}
                    {dict.termsSuffix}
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" loading={isBusy} loadingText={dict.loadingText} disabled={isBusy}>
            {otpEnabled ? (dict.continueToVerify ?? dict.submitButton) : dict.submitButton}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{dict.orSeparator}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <GoogleSignInButton label={dict.googleButton} dict={dict} />
            <Button variant="outline" type="button" disabled title={dict.facebookComingSoon ?? 'Coming soon'}>
              <FacebookIcon className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
              {dict.facebookButton}
            </Button>
          </div>
        </form>
      </Form>
      <div className="mt-6 text-center text-sm">
        {dict.hasAccountPrompt}{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {dict.signInLink}
        </Link>
      </div>
    </>
  );
}

export default RegisterPageClient;
