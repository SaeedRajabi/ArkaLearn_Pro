
'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';

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
import { requestPasswordReset } from '@/lib/api/password-reset';
import { getApiErrorMessage } from '@/lib/api/client';
import { Logo } from './logo';

interface ForgotPasswordPageClientProps {
  dict: any;
  lang: 'en' | 'fa';
}

export default function ForgotPasswordPageClient({ dict, lang }: ForgotPasswordPageClientProps) {
  const { toast } = useToast();

  const formSchema = z.object({
    email: z.string().email({
      message: dict.emailRequired,
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await requestPasswordReset(values.email);
      toast({
        title: dict.successTitle,
        description: dict.successDescription,
      });
      form.reset();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: dict.errorGeneric ?? dict.emailRequired,
        description: getApiErrorMessage(err, dict.successDescription),
      });
    }
  }

  return (
    <>
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-3xl font-bold font-headline">{dict.title}</h1>
        <p className="mt-2 text-muted-foreground">{dict.subtitle}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{dict.emailLabel}</FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:right-3 rtl:left-auto" />
                  <FormControl>
                    <Input
                      placeholder="name@example.com"
                      className="pl-10 rtl:pr-10"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" loading={form.formState.isSubmitting} loadingText={dict.loadingText}>
            {dict.submitButton}
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-primary hover:underline group inline-flex items-center gap-1">
          {lang === 'fa' && <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />}
          {dict.backToLogin}
          {lang === 'en' && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </Link>
      </div>
    </>
  );
}
