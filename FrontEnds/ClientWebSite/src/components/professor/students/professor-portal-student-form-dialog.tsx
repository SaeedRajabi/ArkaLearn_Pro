'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';
import { getDictValue } from '@/lib/i18n-client';
import {
  getPortalStudentRoomProfile,
  upsertPortalStudentRoomProfile,
} from '@/lib/api/professor-students';
import type { Dictionary } from '@/types';

function buildSchema(isEdit: boolean) {
  const passwordField = isEdit
    ? z
        .string()
        .optional()
        .transform((s) => (s ?? '').trim())
        .refine((s) => s === '' || s.length >= 6, { message: 'min6' })
    : z.string().min(6, { message: 'min6' });

  return z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    roomUserName: z.string().min(1),
    password: passwordField,
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export type PortalStudentInitial = {
  fullName?: string;
  userName?: string;
  email?: string;
  phoneNumber?: string;
};

export type PortalStudentSavedPayload = {
  managedRoomStudentId: number;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roomUserName: string;
};

function splitName(fullName?: string): { firstName: string; lastName: string } {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function applyFallback(
  profile: Partial<FormValues & { email?: string; phone?: string; managed?: boolean }>,
  initial?: PortalStudentInitial | null
) {
  const fromName = splitName(initial?.fullName);
  return {
    firstName: profile.firstName || fromName.firstName,
    lastName: profile.lastName || fromName.lastName,
    roomUserName: profile.roomUserName || initial?.userName || '',
    email: profile.email ?? initial?.email ?? '',
    phone: profile.phone ?? initial?.phoneNumber ?? '',
    hasManaged: Boolean(profile.managed),
  };
}

export function ProfessorPortalStudentFormDialog({
  dict,
  open,
  onOpenChange,
  portalUserId,
  initialStudent,
  onSaved,
  onLoadingChange,
}: {
  dict: Dictionary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portalUserId: string | null;
  initialStudent?: PortalStudentInitial | null;
  onSaved?: (payload: PortalStudentSavedPayload) => void;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [hasManagedProfile, setHasManagedProfile] = React.useState(false);

  const t = React.useCallback(
    (key: string, def: string) => getDictValue(dict, key, def),
    [dict]
  );
  const schema = React.useMemo(() => buildSchema(hasManagedProfile), [hasManagedProfile]);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', roomUserName: '', password: '' },
  });

  React.useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  React.useEffect(() => {
    if (!open || !portalUserId || portalUserId === '0') return;

    let cancelled = false;
    setLoading(true);

    void getPortalStudentRoomProfile(portalUserId)
      .then((profile) => {
        if (cancelled) return;
        const merged = applyFallback(
          {
            firstName: profile.firstName,
            lastName: profile.lastName,
            roomUserName: profile.roomUserName ?? '',
            email: profile.email ?? undefined,
            phone: profile.phone ?? undefined,
            managed: Boolean(profile.managedRoomStudentId),
          },
          initialStudent
        );
        setHasManagedProfile(merged.hasManaged);
        setEmail(merged.email);
        setPhone(merged.phone);
        form.reset({
          firstName: merged.firstName,
          lastName: merged.lastName,
          roomUserName: merged.roomUserName,
          password: '',
        });
      })
      .catch(() => {
        if (cancelled) return;
        const merged = applyFallback({}, initialStudent);
        setHasManagedProfile(false);
        setEmail(merged.email);
        setPhone(merged.phone);
        form.reset({
          firstName: merged.firstName,
          lastName: merged.lastName,
          roomUserName: merged.roomUserName,
          password: '',
        });
        toast({
          variant: 'destructive',
          title: t('professorDashboard.students.loadProfileFailed', isRtl ? 'خطا' : 'Error'),
          description: t(
            'professorDashboard.students.loadProfileFailedDesc',
            isRtl
              ? 'اطلاعات کامل بارگذاری نشد. می‌توانید نام کاربری و رمز اتاق را تنظیم کنید.'
              : 'Full profile could not be loaded. You can still set room username and password.'
          ),
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, portalUserId, initialStudent?.fullName, initialStudent?.userName]);

  const handleSubmit = async (values: FormValues) => {
    if (!portalUserId || portalUserId === '0') return;
    setSaving(true);
    try {
      const firstName = values.firstName.trim();
      const lastName = values.lastName.trim();
      const managedId = await upsertPortalStudentRoomProfile({
        portalUserId,
        firstName,
        lastName,
        roomUserName: values.roomUserName.trim(),
        password: values.password?.trim() ? values.password.trim() : null,
      });
      toast({
        title: t('professorDashboard.roomStudents.savedTitle', isRtl ? 'ذخیره شد' : 'Saved'),
        description: t(
          'professorDashboard.roomStudents.savedDesc',
          isRtl ? 'اطلاعات دانشجو و ورود به اتاق به‌روز شد.' : 'Student profile and room credentials updated.'
        ),
      });
      onOpenChange(false);
      onSaved?.({
        managedRoomStudentId: managedId,
        userId: portalUserId,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        roomUserName: values.roomUserName.trim(),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.roomStudents.saveFailed', isRtl ? 'خطا' : 'Error'),
        description: t(
          'professorDashboard.roomStudents.saveFailedDesc',
          isRtl ? 'ذخیره اطلاعات انجام نشد.' : 'Could not save student.'
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>
            {t('professorDashboard.students.editStudent', isRtl ? 'ویرایش دانشجو' : 'Edit student')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'professorDashboard.students.editStudentDesc',
              isRtl
                ? 'نام و نام کاربری/رمز ورود اتاق آنلاین را تنظیم کنید. ایمیل و موبایل قابل تغییر نیستند.'
                : 'Set name and online room username/password. Email and phone cannot be changed.'
            )}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('professorDashboard.roomStudents.firstName', isRtl ? 'نام' : 'First name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('professorDashboard.roomStudents.lastName', isRtl ? 'نام خانوادگی' : 'Last name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FormLabel>{t('professorDashboard.roomStudents.email', isRtl ? 'ایمیل' : 'Email')}</FormLabel>
                  <Input value={email} disabled dir="ltr" className="text-start opacity-70" />
                </div>
                <div className="space-y-2">
                  <FormLabel>{t('professorDashboard.roomStudents.phone', isRtl ? 'موبایل' : 'Phone')}</FormLabel>
                  <Input value={phone} disabled dir="ltr" className="text-start opacity-70" />
                </div>
              </div>
              <FormField
                control={form.control}
                name="roomUserName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('professorDashboard.students.roomUserName', isRtl ? 'نام کاربری اتاق' : 'Room username')}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} dir="ltr" className="text-start" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {hasManagedProfile
                        ? t('professorDashboard.roomStudents.newPassword', isRtl ? 'رمز جدید (اختیاری)' : 'New password (optional)')
                        : t('professorDashboard.roomStudents.password', isRtl ? 'رمز ورود اتاق' : 'Room password')}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="password" dir="ltr" className="text-start" autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                  {t('professorDashboard.roomStudents.cancel', isRtl ? 'انصراف' : 'Cancel')}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t('professorDashboard.roomStudents.save', isRtl ? 'ذخیره' : 'Save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
