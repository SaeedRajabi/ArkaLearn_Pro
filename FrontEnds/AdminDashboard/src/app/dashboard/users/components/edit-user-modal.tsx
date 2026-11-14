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
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/language-provider';
import { adminUpdateUser } from '@/services/user-service';
import type { User } from '@/lib/types';

function buildSchema(t: (key: string) => string) {
  return z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z
      .string()
      .optional()
      .transform((s) => (s ?? '').trim())
      .refine((s) => !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)),
    password: z
      .string()
      .optional()
      .transform((s) => (s ?? '').trim())
      .refine((s) => s === '' || s.length >= 6, { message: t('users_password_min_rule') }),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function splitName(name: string): { firstName: string; lastName: string } {
  const trimmed = name.trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const idx = trimmed.indexOf(' ');
  if (idx < 0) return { firstName: trimmed, lastName: '' };
  return { firstName: trimmed.slice(0, idx), lastName: trimmed.slice(idx + 1).trim() };
}

export function EditUserModal({
  user,
  open,
  onOpenChangeAction,
  onSavedAction,
}: {
  user: User | null;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  onSavedAction: () => void;
}) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const schema = React.useMemo(() => buildSchema(t), [t]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  });

  React.useEffect(() => {
    if (!user) {
      form.reset({ firstName: '', lastName: '', email: '', password: '' });
      return;
    }
    const { firstName, lastName } = splitName(user.name);
    form.reset({
      firstName,
      lastName,
      email: user.email,
      password: '',
    });
  }, [user, form]);

  const handleSave = async (values: FormValues) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await adminUpdateUser({
        userId:user.id,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || undefined,
        password: values.password || undefined,
      });
      toast({
        title: t('users_updated_title'),
        description: t('users_updated_desc').replace('{name}', `${values.firstName} ${values.lastName}`.trim()),
      });
      onOpenChangeAction(false);
      onSavedAction();
    } catch {
      toast({
        variant: 'destructive',
        title: t('validation_error_title'),
        description: t('users_update_failed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users_edit_title')}</DialogTitle>
          <DialogDescription>{t('users_edit_description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('users_edit_first_name')}</FormLabel>
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
                  <FormLabel>{t('users_edit_last_name')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>{t('userTable_col_email')}</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
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
                  <FormLabel>{t('users_edit_password')}</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormDescription>{t('users_password_leave_blank')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChangeAction(false)} disabled={isLoading}>
                {t('actions_cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('users_save_button')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
