'use client';

import * as React from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import '@/components/layout/header-menu.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeSwitcher({
  onThemeChange,
  variant = 'icon',
}: {
  onThemeChange?: () => void;
  variant?: 'icon' | 'inline';
}) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const select = (value: 'light' | 'dark' | 'system') => {
    setTheme(value);
    onThemeChange?.();
  };

  if (variant === 'inline') {
    const active = mounted ? theme ?? 'system' : 'system';
    const options = [
      { value: 'light' as const, Icon: Sun, label: 'Light' },
      { value: 'dark' as const, Icon: Moon, label: 'Dark' },
      { value: 'system' as const, Icon: Laptop, label: 'System' },
    ];

    return (
      <div className="header-theme-row w-full" role="group" aria-label="Theme">
        {options.map(({ value, Icon, label }) => (
          <button
            key={value}
            type="button"
            className={active === value ? 'is-active' : undefined}
            aria-pressed={active === value}
            onClick={() => select(value)}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[200]">
        <DropdownMenuItem onClick={() => select('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => select('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => select('system')}>
          <Laptop className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
