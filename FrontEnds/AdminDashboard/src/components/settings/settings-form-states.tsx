'use client';

import * as React from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/components/language-provider';

type SettingsFormLoadingProps = {
  title?: string;
  description?: string;
};

export function SettingsFormLoading({ title, description }: SettingsFormLoadingProps) {
  const { t } = useLanguage();

  return (
    <Card className="max-w-2xl overflow-hidden">
      <CardHeader className="space-y-2">
        {title ? <CardTitle>{title}</CardTitle> : <Skeleton className="h-7 w-52" />}
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : (
          <Skeleton className="h-4 w-full max-w-md" />
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 p-8">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">{t('settings_form_loading_title')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('settings_form_loading_hint')}</p>
          </div>
        </div>
        <div className="grid gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

type SettingsFormErrorProps = {
  title: string;
  message: string;
  onRetry: () => void;
  retrying?: boolean;
};

export function SettingsFormError({ title, message, onRetry, retrying = false }: SettingsFormErrorProps) {
  const { t } = useLanguage();

  return (
    <Card className="max-w-2xl border-destructive/30">
      <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="max-w-md text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="outline" onClick={onRetry} disabled={retrying}>
          {retrying ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="me-2 h-4 w-4" />
          )}
          {t('settings_form_retry')}
        </Button>
      </CardContent>
    </Card>
  );
}
