'use client';

import { ThemeProvider } from '@/components/shared';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';
import { LanguageProvider } from '@/contexts/language-context';
import { ReactNode } from 'react';

/**
 * ارائه‌دهنده‌های سراسری اپ.
 * AuthProvider اول قرار دارد تا پس از رفرش با getCurrentUser از کوکی، وضعیت کاربر بازیابی شود.
 * برای محافظت از مسیرها از AuthGuard در layout همان مسیر استفاده کنید (مثلاً در app/account/layout).
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          enableColorScheme={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
