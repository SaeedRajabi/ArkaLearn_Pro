"use client";

import { useTransition } from 'react';
import { PasswordLanguageIcon } from '@/components/icons/password-language-icon';

import { setLanguage } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingOverlay } from './loading-overlay';

interface LanguageSwitcherProps {
  lang: 'en' | 'fa';
}

export function LanguageSwitcher({ lang }: LanguageSwitcherProps) {
  const [isPending, startTransition] = useTransition();

  const onSelectLanguage = (newLang: 'en' | 'fa') => {
    startTransition(() => {
      setLanguage(newLang);
    });
  };

  return (
    <>
      {isPending && <LoadingOverlay />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={isPending}>
            <PasswordLanguageIcon className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Switch Language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={lang}
            onValueChange={(value) => onSelectLanguage(value as 'en' | 'fa')}
          >
            <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="fa">فارسی</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
