import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeColorInitializer } from '@/components/theme-color-initializer';
import { LanguageProvider } from '@/components/language-provider';
import { ReactNode } from 'react';
import { AuthProvider } from '@/components/auth-provider';
import { StoreProvider } from '@/components/store-provider';
import { SeminarProvider } from '@/contexts/seminar-context';
import { PwaRegister } from '@/components/pwa/pwa-register';
import { PwaInstallPrompt } from '@/components/pwa/pwa-install-prompt';

const PWA_APP_NAME = 'ArkaSoftware Admin';

export const metadata: Metadata = {
  title: 'ArkaSoftware Admin',
  description: 'Internal admin dashboard.',
  applicationName: PWA_APP_NAME,
  manifest: '/manifest.json',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  icons: {
    icon: [{ url: '/favicon.ico', sizes: 'any' }],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/icons/icon.png', sizes: '512x512', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: PWA_APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content={PWA_APP_NAME} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Wazirmatn:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen overflow-x-hidden" cz-shortcut-listen="false" suppressHydrationWarning>
      <LanguageProvider>
          <AuthProvider>
              <SeminarProvider>
              <StoreProvider>
                  <ThemeProvider
                      attribute="class"
                      defaultTheme="system"
                      enableSystem
                      disableTransitionOnChange
                  >
                      <ThemeColorInitializer />
                      <PwaRegister />
                      {children}
                      <PwaInstallPrompt />
                      <Toaster />
                  </ThemeProvider>
              </StoreProvider>
              </SeminarProvider>
          </AuthProvider>
      </LanguageProvider>
      </body>
    </html>
  );
}
