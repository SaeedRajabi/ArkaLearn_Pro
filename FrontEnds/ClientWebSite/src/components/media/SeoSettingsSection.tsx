'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getDictValue } from '@/lib/i18n-client';
import { cn } from '@/lib/utils';
import { getArticleImageUrl } from '@/lib/utils/image-url';
import type { Dictionary } from '@/types';
import { MediaPickerDialog } from './MediaPickerDialog';

export type SeoSettingsValue = {
  seoTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
};

type Props = {
  dict: Dictionary;
  value: SeoSettingsValue;
  onChange: (value: SeoSettingsValue) => void;
  className?: string;
  defaultOpen?: boolean;
};

function t(dict: Dictionary, key: string, fallback: string) {
  return getDictValue(dict, `seo.${key}`, fallback);
}

export function SeoSettingsSection({ dict, value, onChange, className, defaultOpen = false }: Props) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const metaLength = (value.metaDescription ?? '').length;

  return (
    <Collapsible defaultOpen={defaultOpen} className={cn('rounded-lg border p-4', className)}>
      <CollapsibleTrigger asChild>
        <button type="button" className="flex w-full items-center justify-between text-left font-medium">
          <span>{t(dict, 'sectionTitle', 'SEO settings')}</span>
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="seo-title">{t(dict, 'pageTitle', 'Page title')}</Label>
          <Input
            id="seo-title"
            value={value.seoTitle ?? ''}
            onChange={(e) => onChange({ ...value, seoTitle: e.target.value })}
            placeholder={t(dict, 'pageTitlePlaceholder', 'Leave empty to use main title')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seo-meta">{t(dict, 'metaDescription', 'Meta description')}</Label>
          <Textarea
            id="seo-meta"
            rows={3}
            value={value.metaDescription ?? ''}
            onChange={(e) => onChange({ ...value, metaDescription: e.target.value })}
            placeholder={t(dict, 'metaDescriptionPlaceholder', 'Short description for search engines')}
          />
          <p className={cn('text-xs text-muted-foreground', metaLength > 320 && 'text-destructive')}>
            {metaLength}/320
          </p>
        </div>
        <div className="space-y-2">
          <Label>{t(dict, 'ogImage', 'Social image')}</Label>
          <div className="flex flex-wrap items-center gap-3">
            {value.ogImageUrl ? (
              <div className="relative h-20 w-32 overflow-hidden rounded-md border">
                <Image
                  src={getArticleImageUrl(value.ogImageUrl)}
                  alt={value.seoTitle ?? 'OG'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : null}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                {value.ogImageUrl
                  ? t(dict, 'changeOgImage', 'Change image')
                  : t(dict, 'selectOgImage', 'Select image')}
              </Button>
              {value.ogImageUrl ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...value, ogImageUrl: '' })}>
                  {t(dict, 'removeOgImage', 'Remove')}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </CollapsibleContent>
      <MediaPickerDialog
        dict={dict}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        acceptTypes={['image']}
        onSelect={(item) => {
          onChange({ ...value, ogImageUrl: item.fileUrl });
          setPickerOpen(false);
        }}
      />
    </Collapsible>
  );
}
