'use client';

import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import type { SeminarUser } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/components/language-provider';
import { getSeminarRoleLabel } from '@/lib/utils/localized-ui';

const seminarUserRoles = ['organizer', 'admin', 'presenter', 'participant', 'guest'] as const;

type SeminarUserFormProps = {
  user?: SeminarUser;
  onSaveAction: (data: SeminarUser) => void;
  onCancelAction: () => void;
};

export function SeminarUserForm({ user, onSaveAction, onCancelAction }: SeminarUserFormProps) {
  const { t } = useLanguage();
  const onSave = onSaveAction;
  const onCancel = onCancelAction;

  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(3, { message: t('seminar_user_form_name_min') }),
        displayName: z.string().min(1, { message: t('seminar_user_form_display_name_required') }),
        email: z.string().email({ message: t('seminar_user_form_email_invalid') }),
        username: z.string().min(3, { message: t('seminar_user_form_username_min') }),
        password: z.string().min(6, { message: t('seminar_user_form_password_min') }).optional().or(z.literal('')),
        role: z.enum(seminarUserRoles),
      }),
    [t]
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || '',
      displayName: user?.displayName || '',
      email: user?.email || '',
      username: user?.username || '',
      password: '',
      role: user?.role || 'participant',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newUser: SeminarUser = {
      id: user?.id || `seminar-user-${Date.now()}`,
      avatar: user?.avatar || `https://picsum.photos/seed/${values.username}/200/200`,
      contactNumber: user?.contactNumber || '',
      emailVerified: user?.emailVerified ?? false,
      ...values,
      password: values.password || user?.password || 'password123',
    };
    onSave(newUser);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('seminar_user_form_name_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('seminar_user_form_name_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('seminar_user_form_display_name_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('seminar_user_form_display_name_placeholder')} {...field} />
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
              <FormLabel>{t('seminar_user_form_email_label')}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={t('seminar_user_form_email_placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('seminar_user_form_username_label')}</FormLabel>
              <FormControl>
                <Input placeholder={t('seminar_user_form_username_placeholder')} {...field} />
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
              <FormLabel>{t('login_password_label')}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={user ? t('seminar_user_form_password_keep_placeholder') : t('seminar_user_form_password_placeholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('seminar_user_form_role_label')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('seminar_user_form_role_placeholder')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {seminarUserRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {getSeminarRoleLabel(role, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('actions_cancel')}
          </Button>
          <Button type="submit">{t('seminar_user_form_save_button')}</Button>
        </div>
      </form>
    </Form>
  );
}
