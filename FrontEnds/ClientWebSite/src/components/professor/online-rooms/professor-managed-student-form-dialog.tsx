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
import type { Dictionary } from '@/types';
import {
  createManagedRoomStudent,
  updateManagedRoomStudent,
  uploadManagedRoomStudentPhoto,
  type ManagedRoomStudent,
} from '@/lib/api/professor-managed-students';

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
    userName: z.string().min(1),
    email: z.string().optional(),
    password: passwordField,
    phone: z.string().optional(),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export function ProfessorManagedStudentFormDialog({
  dict,
  open,
  onOpenChange,
  student,
  onSaved,
}: {
  dict: Dictionary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: ManagedRoomStudent | null;
  onSaved?: () => void;
}) {
  const { locale } = useLanguage();
  const isRtl = locale === 'fa';
  const { toast } = useToast();
  const isEdit = Boolean(student?.id);
  const [saving, setSaving] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const t = (key: string, def: string) => getDictValue(dict, key, def);

  const schema = React.useMemo(() => buildSchema(isEdit), [isEdit]);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      userName: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  React.useEffect(() => {
    if (!open) return;
    if (!student) {
      form.reset({ firstName: '', lastName: '', userName: '', email: '', password: '', phone: '' });
      return;
    }
    form.reset({
      firstName: student.firstName ?? '',
      lastName: student.lastName ?? '',
      userName: student.userName ?? '',
      email: student.email ?? '',
      password: '',
      phone: student.phone ?? '',
    });
  }, [open, student, form]);

  const handleSubmit = async (values: FormValues) => {
    setSaving(true);
    const photo = fileRef.current?.files?.[0] ?? null;
    try {
      if (isEdit && student) {
        await updateManagedRoomStudent({
          id: student.id,
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          userName: values.userName.trim(),
          email: values.email?.trim() || null,
          password: values.password?.trim() ? values.password.trim() : null,
          phone: values.phone?.trim() || null,
        });
        if (photo) await uploadManagedRoomStudentPhoto(student.id, photo);
      } else {
        const id = await createManagedRoomStudent({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          userName: values.userName.trim(),
          email: values.email?.trim() || null,
          password: String(values.password || ''),
          phone: values.phone?.trim() || null,
        });
        if (photo && id) await uploadManagedRoomStudentPhoto(id, photo);
      }
      toast({
        title: t('professorDashboard.roomStudents.savedTitle', isRtl ? 'ذخیره شد' : 'Saved'),
        description: t(
          'professorDashboard.roomStudents.savedDesc',
          isRtl ? 'اطلاعات دانشجو برای ورود به اتاق به‌روز شد.' : 'Room login credentials updated.'
        ),
      });
      onOpenChange(false);
      onSaved?.();
    } catch {
      toast({
        variant: 'destructive',
        title: t('professorDashboard.roomStudents.saveFailed', isRtl ? 'خطا' : 'Error'),
        description: t(
          'professorDashboard.roomStudents.saveFailedDesc',
          isRtl ? 'ذخیره اطلاعات دانشجو انجام نشد.' : 'Could not save student.'
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
            {isEdit
              ? t('professorDashboard.roomStudents.editTitle', isRtl ? 'ویرایش دانشجو' : 'Edit student')
              : t('professorDashboard.roomStudents.addTitle', isRtl ? 'افزودن دانشجو' : 'Add student')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'professorDashboard.roomStudents.formDesc',
              isRtl
                ? 'نام کاربری و رمز ورود برای ورود دانشجو به اتاق آنلاین را تنظیم کنید.'
                : 'Set username and password for online room login.'
            )}
          </DialogDescription>
        </DialogHeader>
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
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('professorDashboard.roomStudents.userName', isRtl ? 'نام کاربری' : 'Username')}</FormLabel>
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
                    {isEdit
                      ? t('professorDashboard.roomStudents.newPassword', isRtl ? 'رمز جدید (اختیاری)' : 'New password (optional)')
                      : t('professorDashboard.roomStudents.password', isRtl ? 'رمز ورود' : 'Password')}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="password" dir="ltr" className="text-start" autoComplete="new-password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('professorDashboard.roomStudents.email', isRtl ? 'ایمیل' : 'Email')}</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" dir="ltr" className="text-start" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('professorDashboard.roomStudents.phone', isRtl ? 'موبایل' : 'Phone')}</FormLabel>
                  <FormControl>
                    <Input {...field} dir="ltr" className="text-start" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>{t('professorDashboard.roomStudents.photo', isRtl ? 'تصویر (اختیاری)' : 'Photo (optional)')}</FormLabel>
              <Input ref={fileRef} type="file" accept="image/*" />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('professorDashboard.roomStudents.cancel', isRtl ? 'انصراف' : 'Cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t('professorDashboard.roomStudents.save', isRtl ? 'ذخیره' : 'Save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
