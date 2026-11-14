'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
import { useToast } from '@/hooks/use-toast';
import { resetPassword } from '@/lib/api/password-reset';
import { getApiErrorMessage } from '@/lib/api/client';
import { Logo } from './logo';

type ResetPasswordDict = {
  title: string;
  subtitle: string;
  passwordLabel: string;
  confirmPasswordLabel: string;
  submitButton: string;
  backToLogin: string;
  passwordMin: string;
  passwordMismatch: string;
  successTitle: string;
  successDescription: string;
  errorGeneric: string;
  loadingText: string;
  invalidToken: string;
};

export default function ResetPasswordPageClient({
  dict,
  lang,
  token,
}: {
  dict: ResetPasswordDict;
  lang: 'en' | 'fa';
  token: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [done, setDone] = useState(false);

  const formSchema = z
    .object({
      password: z.string().min(8, { message: dict.passwordMin }),
      confirmPassword: z.string().min(8, { message: dict.passwordMin }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: dict.passwordMismatch,
      path: ['confirmPassword'],
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token.trim()) {
      toast({ variant: 'destructive', title: dict.errorGeneric, description: dict.invalidToken });
      return;
    }
    try {
      await resetPassword(token.trim(), values.password);
      setDone(true);
      toast({ title: dict.successTitle, description: dict.successDescription });
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: dict.errorGeneric,
        description: getApiErrorMessage(err, dict.invalidToken),
      });
    }
  }

  if (!token.trim()) {
    return (
      <div className="text-center">
        <p className="text-destructive">{dict.invalidToken}</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-primary hover:underline">
          {dict.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>
        <h1 className="font-headline text-3xl font-bold">{dict.title}</h1>
        <p className="mt-2 text-muted-foreground">{dict.subtitle}</p>
      </div>

      {done ? (
        <div className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
          <p className="font-medium">{dict.successTitle}</p>
          <p className="mt-2 text-sm text-muted-foreground">{dict.successDescription}</p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{dict.passwordLabel}</FormLabel>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground rtl:right-3 rtl:left-auto" />
                    <FormControl>
                      <Input type="password" className="pl-10 rtl:pr-10" {...field} />
                    </FormControl>
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
                    <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground rtl:right-3 rtl:left-auto" />
                    <FormControl>
                      <Input type="password" className="pl-10 rtl:pr-10" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              loading={form.formState.isSubmitting}
              loadingText={dict.loadingText}
            >
              {dict.submitButton}
            </Button>
          </form>
        </Form>
      )}

      <div className="mt-6 text-center text-sm">
        <Link
          href="/login"
          className="group inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          {lang === 'fa' && <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />}
          {dict.backToLogin}
          {lang === 'en' && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </Link>
      </div>
    </>
  );
}
