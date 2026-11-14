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
import { useLanguage } from '@/components/language-provider';
import { adminCreateUser } from '@/services/admin-user-management-api.service';

function buildSchema(t: (key: string) => string) {
  return z.object({
    userName: z.string().min(3, t('add_portal_user_username_min')),
    fullName: z.string().min(2, t('add_portal_user_name_min')),
    email: z.string().email(t('add_portal_user_email_invalid')),
    phoneNumber: z.string().min(10, t('add_portal_user_phone_min')),
    password: z.string().min(6, t('users_password_min_rule')),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export function AddPortalUserModal({
  open,
  onOpenChange,
  role,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: 'STUDENT' | 'TEACHER';
  onCreated?: () => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);
  const schema = React.useMemo(() => buildSchema(t), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      userName: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
    },
  });

  React.useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const handleSave = async (values: FormValues) => {
    setBusy(true);
    try {
      await adminCreateUser({
        userName: values.userName.trim(),
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phoneNumber: values.phoneNumber.trim(),
        password: values.password,
        userRole: role,
      });
      toast({
        title: t('add_portal_user_success_title'),
        description: t('add_portal_user_success_desc').replace('{name}', values.fullName),
      });
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: err instanceof Error ? err.message : t('add_portal_user_failed'),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {role === 'STUDENT' ? t('add_student_title') : t('add_teacher_title')}
          </DialogTitle>
          <DialogDescription>
            {role === 'STUDENT' ? t('add_student_description') : t('add_teacher_description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('add_portal_user_fullname_label')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('add_portal_user_fullname_placeholder')} />
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
                  <FormLabel>{t('add_portal_user_username_label')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('add_portal_user_username_placeholder')} />
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
                  <FormLabel>{t('add_portal_user_email_label')}</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} placeholder={t('add_portal_user_email_placeholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('add_portal_user_phone_label')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('add_portal_user_phone_placeholder')} />
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
                  <FormLabel>{t('add_portal_user_password_label')}</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('add_portal_user_save_button')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
