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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LocalizedDatePicker } from '@/components/ui/localized-date-picker';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import {
  createManagedRoomStudent,
  updateManagedRoomStudent,
  uploadManagedRoomStudentPhoto,
  type ManagedRoomStudentRow,
} from '@/services/managed-room-students-service';
import {
  apiDateStringToLocalDate,
  dateToApiDateString,
} from '@/lib/utils/localized-dates';

function buildSchema(isEdit: boolean, t: (key: string) => string) {
  const passwordField = isEdit
    ? z
        .string()
        .optional()
        .transform((s) => (s ?? '').trim())
        .refine((s) => s === '' || s.length >= 6, { message: t('room_students_password_min_rule') })
    : z.string().min(6, { message: t('room_students_password_min_rule') });

  return z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    userName: z.string().min(1),
    email: z
      .string()
      .optional()
      .transform((s) => (s ?? '').trim())
      .refine((s) => !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), { message: 'email' }),
    password: passwordField,
    phone: z.string().optional(),
    notes: z.string().optional(),
    gender: z.string().optional(),
    dateOfBirth: z.string().optional(),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function ManagedRoomStudentModalForm({
  studentToEdit,
  onOpenChangeAction,
  onSavedAction,
}: {
  studentToEdit: ManagedRoomStudentRow | null | undefined;
  onOpenChangeAction: (open: boolean) => void;
  onSavedAction: (createdId?: number) => void;
}) {
  const isEdit = !!studentToEdit;
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  const schema = React.useMemo(() => buildSchema(isEdit, t), [isEdit, t]);

  const defaultEmpty = {
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    password: '',
    phone: '',
    notes: '',
    gender: '',
    dateOfBirth: '',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultEmpty,
  });

  React.useEffect(() => {
    if (!studentToEdit) {
      form.reset(defaultEmpty);
      return;
    }
    const dobRaw = studentToEdit.dateOfBirth ?? '';
    const dob = typeof dobRaw === 'string' ? dobRaw.slice(0, 10) : '';
    form.reset({
      firstName: studentToEdit.firstName ?? '',
      lastName: studentToEdit.lastName ?? '',
      userName: studentToEdit.userName ?? '',
      email: studentToEdit.email ?? '',
      password: '',
      phone: studentToEdit.phone ?? '',
      notes: studentToEdit.notes ?? '',
      gender: studentToEdit.gender ?? '',
      dateOfBirth: dob,
    });
  }, [studentToEdit, form]);

  const handleSave = async (values: FormValues) => {
    setIsLoading(true);
    const file = fileRef.current?.files?.[0] ?? null;
    let createdId: number | undefined;
    try {
      if (!isEdit) {
        const id = await createManagedRoomStudent({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          userName: values.userName.trim(),
          email: values.email?.trim() || null,
          password: String(values.password || ''),
          phone: values.phone?.trim() || null,
          notes: values.notes?.trim() || null,
          gender: values.gender?.trim() || null,
          dateOfBirth: values.dateOfBirth?.trim() || null,
        });
        if (file && id) {
          try {
            await uploadManagedRoomStudentPhoto(id, file);
          } catch {
            toast({
              variant: 'destructive',
              title: t('validation_error_title'),
              description: t('room_students_photo_upload_failed'),
            });
          }
        }
        createdId = id ?? undefined;
        toast({
          title: t('toast_settings_saved_title'),
          description: t('room_students_created'),
        });
      } else if (studentToEdit) {
        await updateManagedRoomStudent({
          id: studentToEdit.id,
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          userName: values.userName.trim(),
          email: values.email?.trim() || null,
          password:
            typeof values.password === 'string' && values.password.trim().length > 0
              ? values.password.trim()
              : null,
          phone: values.phone?.trim() || null,
          notes: values.notes?.trim() || null,
          gender: values.gender?.trim() || null,
          dateOfBirth: values.dateOfBirth?.trim() || null,
        });
        if (file) {
          try {
            await uploadManagedRoomStudentPhoto(studentToEdit.id, file);
          } catch {
            toast({
              variant: 'destructive',
              title: t('validation_error_title'),
              description: t('room_students_photo_upload_failed_edit'),
            });
          }
        }
        toast({
          title: t('toast_settings_saved_title'),
          description: t('room_students_updated'),
        });
      }

      onOpenChangeAction(false);
      onSavedAction(createdId);
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: isEdit ? t('room_students_update_failed') : t('room_students_create_failed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? t('room_students_edit_title') : t('room_students_add_title')}</DialogTitle>
        <DialogDescription>
          {isEdit ? t('room_students_edit_description') : t('room_students_add_description')}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('room_students_first_name')}</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="given-name" />
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
                  <FormLabel>{t('room_students_last_name')}</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="family-name" />
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
                  <FormLabel>{t('room_students_user_name')}</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('room_students_email')}</FormLabel>
                <FormControl>
                  <Input {...field} type="email" autoComplete="email" />
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
                <FormLabel>{t('room_students_password')}</FormLabel>
                <FormControl>
                  <Input {...field} type="password" autoComplete="new-password" />
                </FormControl>
                {isEdit ? (
                  <FormDescription>
                    {t('room_students_password_leave_blank')} {t('room_students_room_login_hint')}
                  </FormDescription>
                ) : (
                  <FormDescription>{t('room_students_room_login_hint')}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('room_students_phone')}</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="tel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('room_students_gender')}</FormLabel>
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
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('room_students_dob')}</FormLabel>
                <FormControl>
                  <LocalizedDatePicker
                    value={apiDateStringToLocalDate(field.value)}
                    onChange={(date) => field.onChange(date ? dateToApiDateString(date) : '')}
                    placeholder={t('room_students_dob')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('room_students_notes')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>{t('room_students_photo')}</FormLabel>
            <FormControl>
              <Input ref={fileRef} type="file" accept="image/*" className="cursor-pointer" />
            </FormControl>
          </FormItem>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChangeAction(false)}>
              {t('actions_cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? t('save_changes') : t('room_students_add_button')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

export function AddManagedRoomStudentModal({
  open,
  onOpenChangeAction,
  onCreatedAction,
  studentToEdit,
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onCreatedAction: (createdId?: number) => void;
  /** When set, the modal edits this student instead of creating a new one. */
  studentToEdit?: ManagedRoomStudentRow | null;
}) {
  const formKey = studentToEdit ? `edit-${studentToEdit.id}` : 'create';

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        {open ? (
          <ManagedRoomStudentModalForm
            key={formKey}
            studentToEdit={studentToEdit ?? null}
            onOpenChangeAction={onOpenChangeAction}
            onSavedAction={onCreatedAction}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
