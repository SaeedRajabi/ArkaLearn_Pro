
'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useThemeColor } from '@/hooks/use-theme-color';
import { RotateCcw } from 'lucide-react';
import { useLanguage } from '@/components/language-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function hexToHsl(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(hsl: string): string {
  if (!hsl) return '#000000';
  const hslMatch = hsl.match(/(\d+(\.\d+)?)/g);
  if (!hslMatch || hslMatch.length < 3) return '#000000';

  const [h, s, l] = hslMatch.map(Number);
  const sDecimal = s / 100;
  const lDecimal = l / 100;

  const c = (1 - Math.abs(2 * lDecimal - 1)) * sDecimal;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lDecimal - c / 2;

  let r = 0,
    g = 0,
    b = 0;
  if (h >= 0 && h < 60) {
    [r, g, b] = [c, x, 0];
  } else if (h >= 60 && h < 120) {
    [r, g, b] = [x, c, 0];
  } else if (h >= 120 && h < 180) {
    [r, g, b] = [0, c, x];
  } else if (h >= 180 && h < 240) {
    [r, g, b] = [0, x, c];
  } else if (h >= 240 && h < 300) {
    [r, g, b] = [x, 0, c];
  } else {
    [r, g, b] = [c, 0, x];
  }

  const toHex = (val: number) =>
    Math.round((val + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function ColorInput({
  label,
  color,
  setColor,
  onReset,
}: {
  label: string;
  color: string;
  setColor: (color: string) => void;
  onReset: () => void;
}) {
  const id = React.useId();

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative flex items-center">
        <input
          id={id}
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 border-none cursor-pointer rtl:left-auto rtl:right-2"
        />
        <div className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-12 py-2 text-base ring-offset-background flex items-center md:text-sm rtl:pl-12 rtl:pr-10">
          {color.toUpperCase()}
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground rtl:right-auto rtl:left-1"
          onClick={onReset}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function PersonalizationSettings() {
  const { t } = useLanguage();
  const [primary, setPrimary, defaultPrimary] = useThemeColor(
    '--primary',
    '231 48% 48%'
  );
  const [accent, setAccent, defaultAccent] = useThemeColor(
    '--accent',
    '174 100% 29%'
  );
  
  const { toast } = useToast();

  const [draftPrimary, setDraftPrimary] = React.useState(hslToHex(primary));
  const [draftAccent, setDraftAccent] = React.useState(hslToHex(accent));
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted) {
      setDraftPrimary(hslToHex(primary));
      setDraftAccent(hslToHex(accent));
    }
  }, [primary, accent, mounted]);

  const defaultPrimaryHex = hslToHex(defaultPrimary);
  const defaultAccentHex = hslToHex(defaultAccent);
  
  const handleSave = () => {
    setPrimary(hexToHsl(draftPrimary));
    setAccent(hexToHsl(draftAccent));
    toast({
      title: t('toast_settings_saved_title'),
      description: t('toast_appearance_saved_desc'),
    });
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('personalization_title')}</CardTitle>
        <CardDescription>
          {t('personalization_description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColorInput
            label={t('primary_color_label')}
            color={draftPrimary}
            setColor={setDraftPrimary}
            onReset={() => setDraftPrimary(defaultPrimaryHex)}
          />
          <ColorInput
            label={t('accent_color_label')}
            color={draftAccent}
            setColor={setDraftAccent}
            onReset={() => setDraftAccent(defaultAccentHex)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>{t('save_changes')}</Button>
      </CardFooter>
    </Card>
  );
}

function AppearanceSettings() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { t } = useLanguage();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('theme_title')}</CardTitle>
          <CardDescription>
            {t('theme_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mounted ? (
            <RadioGroup
              value={theme}
              onValueChange={setTheme}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="light"
                  id="light"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="light"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  {t('theme_light')}
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="dark"
                  id="dark"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="dark"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  {t('theme_dark')}
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="system"
                  id="system"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="system"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  {t('theme_system')}
                </Label>
              </div>
            </RadioGroup>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-[74px] w-full" />
              <Skeleton className="h-[74px] w-full" />
              <Skeleton className="h-[74px] w-full" />
            </div>
          )}
        </CardContent>
      </Card>
      <PersonalizationSettings />
    </div>
  );
}

function LanguageRegionSettings() {
  const { locale, setLocale, t } = useLanguage();
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: t('toast_settings_saved_title'),
      description: t('toast_language_saved_desc'),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('language_region_title')}</CardTitle>
        <CardDescription>
          {t('language_region_description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="language">{t('language_label')}</Label>
           <Select value={locale} onValueChange={(value) => setLocale(value as 'en' | 'fa')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('language_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t('language_en')}</SelectItem>
              <SelectItem value="fa">{t('language_fa')}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {t('language_description')}
          </p>
        </div>
         <div className="space-y-2">
          <Label htmlFor="region">{t('region_label')}</Label>
           <Select defaultValue="en-US">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('region_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en-US">{t('region_us')}</SelectItem>
              <SelectItem value="ir-FA">{t('region_ir')}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {t('region_description')}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>{t('save_changes')}</Button>
      </CardFooter>
    </Card>
  );
}

export function DashboardSettingsForm() {
  const { t , direction } = useLanguage();
  return (
    <div className="space-y-6">
      <Tabs defaultValue="appearance" className="space-y-6" dir={direction}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="appearance">{t('settings_tab_appearance')}</TabsTrigger>
          <TabsTrigger value="language">{t('settings_tab_language')}</TabsTrigger>
        </TabsList>
        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>
        <TabsContent value="language">
          <LanguageRegionSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
