'use client';

import { useState } from 'react';
import { BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GoogleIcon } from '@/components/icons/google-icon';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  getGoogleClientId,
  loginWithGoogle,
  markPhoneVerifyNudge,
  USER_ROLE_STUDENT,
  USER_ROLE_TEACHER,
} from '@/lib/api/account';
import { resolveLoginErrorMessage } from '@/lib/auth/login-error-messages';
import { postAuthNavigate } from '@/lib/auth/post-auth-navigate';
import { resolvePostLoginPath } from '@/lib/auth/roles';
import { requestGoogleIdToken } from '@/lib/google-identity';
import { cn } from '@/lib/utils';

type AccountType = 'student' | 'professor';

type GoogleSignInButtonProps = {
  label: string;
  className?: string;
  dict?: Record<string, string>;
};

export function GoogleSignInButton({ label, className, dict = {} }: GoogleSignInButtonProps) {
  const router = useRouter();
  const { setSessionFromUserData, setError } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [previewEmail, setPreviewEmail] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('student');
  const [roleOpen, setRoleOpen] = useState(false);

  const t = (key: string, fallback: string) => dict[key] ?? fallback;

  const completeSession = (userData: Record<string, unknown> | undefined, needsPhone: boolean) => {
    if (!setSessionFromUserData(userData)) {
      throw new Error(
        t(
          'googleSignInFailed',
          'Sign-in failed. The server did not return a valid user profile. Please try again.'
        )
      );
    }
    if (needsPhone) {
      markPhoneVerifyNudge();
      toast({
        variant: 'default',
        title: t('phoneVerifyWarningTitle', 'Verify your phone number'),
        description: t(
          'phoneVerifyWarningDescription',
          'Please verify your phone number so you can receive notifications about your students and account activity.'
        ),
      });
    }
    const role = String(userData?.Role ?? userData?.role ?? '');
    postAuthNavigate(router, resolvePostLoginPath(role));
  };

  const finishWithRole = async (token: string, role: number) => {
    const res = await loginWithGoogle({ token, userRole: role });
    if (res.requiresAccountType) {
      setPendingToken(token);
      setPreviewEmail(res.email || '');
      setPreviewName(res.name || '');
      setRoleOpen(true);
      return;
    }
    completeSession(res.userData as Record<string, unknown> | undefined, !!res.requiresPhoneVerification);
  };

  const handleGoogleClick = async () => {
    setError(null);
    setBusy(true);
    try {
      const clientId = await getGoogleClientId();
      const idToken = await requestGoogleIdToken(clientId);
      const res = await loginWithGoogle({ token: idToken });
      if (res.requiresAccountType) {
        setPendingToken(idToken);
        setPreviewEmail(res.email || '');
        setPreviewName(res.name || '');
        setAccountType('student');
        setRoleOpen(true);
        return;
      }
      completeSession(res.userData as Record<string, unknown> | undefined, !!res.requiresPhoneVerification);
    } catch (e: unknown) {
      const msg = resolveLoginErrorMessage(e, {
        loginFailed: t('googleSignInFailed', 'Google sign-in failed. Please try again.'),
      });
      setError(msg);
      toast({
        variant: 'destructive',
        title: t('googleSignInFailedTitle', 'Google sign-in failed'),
        description: msg,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmRole = async () => {
    if (!pendingToken) return;
    setBusy(true);
    try {
      const role = accountType === 'professor' ? USER_ROLE_TEACHER : USER_ROLE_STUDENT;
      await finishWithRole(pendingToken, role);
      setRoleOpen(false);
      setPendingToken(null);
    } catch (e: unknown) {
      const msg = resolveLoginErrorMessage(e, {
        loginFailed: t('googleSignInFailed', 'Google sign-in failed. Please try again.'),
      });
      setError(msg);
      toast({
        variant: 'destructive',
        title: t('googleSignInFailedTitle', 'Google sign-in failed'),
        description: msg,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        type="button"
        className={cn(className)}
        disabled={busy}
        onClick={() => void handleGoogleClick()}
      >
        {busy ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin rtl:ml-2 rtl:mr-0" />
        ) : (
          <GoogleIcon className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
        )}
        {label}
      </Button>

      <Dialog
        open={roleOpen}
        onOpenChange={(open) => {
          if (busy) return;
          setRoleOpen(open);
          if (!open) setPendingToken(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('googleAccountTypeTitle', 'Complete your Google registration')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'googleAccountTypeDescription',
                'Choose whether you are joining as a student or a teacher. You can finish setup after sign-in.'
              )}
              {(previewName || previewEmail) && (
                <span className="mt-2 block text-foreground">
                  {previewName ? `${previewName} · ` : ''}
                  {previewEmail}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={accountType}
            onValueChange={(v) => setAccountType(v as AccountType)}
            className="grid grid-cols-1 gap-3"
          >
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:border-primary has-[:checked]:border-primary">
              <RadioGroupItem value="student" />
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t('accountTypeStudent', 'Student')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('accountTypeStudentDesc', 'Learn courses and seminars')}
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:border-primary has-[:checked]:border-primary">
              <RadioGroupItem value="professor" />
              <GraduationCap className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t('accountTypeProfessor', 'Professor')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('accountTypeProfessorDesc', 'Create your public teacher profile')}
                </p>
              </div>
            </label>
          </RadioGroup>

          <DialogFooter>
            <Button type="button" disabled={busy} onClick={() => void handleConfirmRole()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('googleAccountTypeContinue', 'Continue')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
