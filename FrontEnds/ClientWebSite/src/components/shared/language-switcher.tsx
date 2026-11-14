'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LanguagesIcon, Loader2 } from 'lucide-react';
import { setLanguage } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import '@/components/layout/header-menu.css';
import { HeaderMenuPortal } from '@/components/layout/header-menu-portal';

interface LanguageSwitcherProps {
  lang: 'en' | 'fa';
  onLanguageChange?: () => void;
  variant?: 'icon' | 'inline';
}

export function LanguageSwitcher({ lang, onLanguageChange, variant = 'icon' }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const onSelectLanguage = (newLang: 'en' | 'fa') => {
    if (newLang === lang) {
      setOpen(false);
      return;
    }
    onLanguageChange?.();
    setOpen(false);
    startTransition(() => {
      void setLanguage(newLang);
      const params = new URLSearchParams(searchParams.toString());
      params.set('lang', newLang);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
      router.refresh();
    });
  };

  if (variant === 'inline') {
    return (
      <div className="flex w-full gap-2" role="group" aria-label="Language">
        <button
          type="button"
          className={`header-menu__item flex-1 justify-center${lang === 'en' ? ' header-menu__item--active' : ''}`}
          aria-pressed={lang === 'en'}
          disabled={isPending}
          onClick={() => onSelectLanguage('en')}
        >
          English
        </button>
        <button
          type="button"
          className={`header-menu__item flex-1 justify-center${lang === 'fa' ? ' header-menu__item--active' : ''}`}
          aria-pressed={lang === 'fa'}
          disabled={isPending}
          onClick={() => onSelectLanguage('fa')}
        >
          فارسی
        </button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="header-menu">
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={isPending}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {isPending ? (
          <Loader2 className="h-[1.2rem] w-[1.2rem] animate-spin" />
        ) : (
          <LanguagesIcon className="h-[1.2rem] w-[1.2rem]" />
        )}
        <span className="sr-only">Switch Language</span>
      </Button>

      <HeaderMenuPortal
        open={open}
        anchorRef={rootRef}
        onPanelMount={(el) => {
          panelRef.current = el;
        }}
        className="header-menu__panel"
      >
          <button
            type="button"
            role="menuitemradio"
            aria-checked={lang === 'en'}
            className={`header-menu__item${lang === 'en' ? ' header-menu__item--active' : ''}`}
            onClick={() => onSelectLanguage('en')}
          >
            English
          </button>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={lang === 'fa'}
            className={`header-menu__item${lang === 'fa' ? ' header-menu__item--active' : ''}`}
            onClick={() => onSelectLanguage('fa')}
          >
            فارسی
          </button>
      </HeaderMenuPortal>
    </div>
  );
}
