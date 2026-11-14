import type { Metadata, Viewport } from 'next';
import { cookies, headers } from 'next/headers';
import { cn } from '@/lib/utils';
import { getDictionary } from '@/lib/i18n';
import { Toaster } from '@/components/ui/toaster';
import { Header, Footer } from '@/components/layout';
import {
  ThemeProvider,
  PageProgressBar,
  PwaInstallPrompt,
  InitialLoading,
  MainContentLoader,
  NavigationLoadingBoundary,
} from '@/components/shared';
import { AuthProvider } from '@/contexts/auth-context';
import { BasketProvider } from '@/contexts/basket-context';
import { FavoritesProvider } from '@/contexts/favorites-context';
import { SeminarFavoritesProvider } from '@/contexts/seminar-favorites-context';
import { ArticleFavoritesProvider } from '@/contexts/article-favorites-context';
import { LanguageProvider } from '@/contexts/language-context';
import { Suspense } from 'react';
import { getDefaultMetadata } from '@/lib/seo';
import {
  BRAND_NAME_BILINGUAL,
  BRAND_NAME_FA,
  BRAND_ICON_PATH,
  BRAND_ICON_192_PATH,
  BRAND_APPLE_TOUCH_PATH,
  BRAND_FAVICON_PATH,
} from '@/lib/seo/brand';
import { JsonLdOrganization } from '@/components/shared/json-ld-organization';
import { JsonLdWebSite } from '@/components/shared/json-ld-website';
import { JsonLdSiteNavigation } from '@/components/shared/json-ld-site-navigation';
import { pageLayout } from '@/lib/utils/page-layout';
import { isSiteLocale, SITE_LOCALE_HEADER } from '@/lib/seo/hreflang';
import { getContactUsPage } from '@/lib/api/contact';
import { getSiteAnnouncement } from '@/lib/api/site-announcement';
import { SiteAnnouncementBar } from '@/components/layout/site-announcement-bar';
import { UserActivityTracker } from '@/components/shared/user-activity-tracker';
import { SiteUpdateOverlay } from '@/components/shared/site-update-overlay';
import { PhoneVerifyNudgeListener } from '@/components/auth/phone-verify-nudge-listener';
import { BackendStatusProvider } from '@/contexts/backend-status-context';
import './globals.css';

const PWA_APP_NAME = BRAND_NAME_BILINGUAL;

export const metadata: Metadata = {
  ...getDefaultMetadata(),
  applicationName: BRAND_NAME_FA,
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: BRAND_FAVICON_PATH, sizes: '48x48' },
      { url: BRAND_ICON_192_PATH, type: 'image/png', sizes: '192x192' },
      { url: BRAND_ICON_PATH, type: 'image/png', sizes: '512x512' },
    ],
    shortcut: [BRAND_FAVICON_PATH],
    apple: [{ url: BRAND_APPLE_TOUCH_PATH, sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: BRAND_NAME_FA,
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const localeHeader = headerStore.get(SITE_LOCALE_HEADER);
  const cookieLang = cookieStore.get('lang')?.value;
  const lang = (isSiteLocale(localeHeader) ? localeHeader : isSiteLocale(cookieLang) ? cookieLang : 'fa') as 'en' | 'fa';
  const dir = lang === 'fa' ? 'rtl' : 'ltr';
  const [dict, contactContent, siteAnnouncement] = await Promise.all([
    getDictionary(lang),
    getContactUsPage(),
    getSiteAnnouncement(),
  ]);

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement,c=d.classList;var e=localStorage.getItem('theme');if(e==='system'||!e)e=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';c.remove('light','dark');c.add(e);}catch(t){}})();`,
          }}
        />
        <JsonLdOrganization contactContent={contactContent} />
        <JsonLdWebSite />
        <JsonLdSiteNavigation />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href={BRAND_FAVICON_PATH} sizes="48x48" />
        <link rel="icon" type="image/png" href={BRAND_ICON_192_PATH} sizes="192x192" />
        <link rel="apple-touch-icon" href={BRAND_APPLE_TOUCH_PATH} sizes="180x180" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={BRAND_NAME_FA} />
      </head>
      <body
        className={cn(
          'min-h-screen max-w-full overflow-x-clip bg-background font-body antialiased'
        )}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // بررسی اینکه آیا باید لودینگ نمایش داده شود
                let shouldShow = false;
                try {
                  const navEntry = performance.getEntriesByType('navigation')[0];
                  if (navEntry) {
                    const navType = navEntry.type;
                    if (navType === 'reload') {
                      shouldShow = true;
                    } else if (navType === 'navigate' && navEntry.transferSize > 0) {
                      shouldShow = true;
                    }
                  }
                } catch(e) {}
                
                if (shouldShow || !sessionStorage.getItem('_app_has_shown_loading')) {
                  // ایجاد لودینگ اولیه
                  const loadingDiv = document.createElement('div');
                  loadingDiv.id = 'initial-loading-screen';
                  loadingDiv.innerHTML = \`
                    <div style="position: fixed; inset: 0; z-index: 99999; display: flex; flex-direction: column; align-items: center; justify-content: center; background: hsl(0 0% 100%); font-family: Wazirmatn, system-ui, -apple-system, sans-serif;">
                      <div style="display: flex; flex-direction: column; align-items: center; gap: 1.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                          <img src="/brand/icon-192.png" width="56" height="56" alt="آرکا نرم افزار" style="border-radius: 12px;">
                          <span style="font-size: 1.25rem; font-weight: bold; color: hsl(222.2 84% 4.9%);">آرکا نرم افزار</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                          <div style="width: 24px; height: 24px; border: 2px solid hsl(0 84.2% 60.2%); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                          <span style="font-size: 0.875rem; color: hsl(215.4 16.3% 46.9%);">در حال بارگذاری...</span>
                        </div>
                      </div>
                    </div>
                    <style>
                      @keyframes spin {
                        to { transform: rotate(360deg); }
                      }
                      @media (prefers-color-scheme: dark) {
                        #initial-loading-screen > div {
                          background: hsl(222.2 84% 4.9%) !important;
                        }
                        #initial-loading-screen span {
                          color: hsl(210 40% 98%) !important;
                        }
                        #initial-loading-screen div[style*="color: hsl(215.4"] {
                          color: hsl(215.4 16.3% 56.9%) !important;
                        }
                      }
                    </style>
                  \`;
                  document.body.appendChild(loadingDiv);
                }
              })();
            `,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          enableColorScheme={false}
          disableTransitionOnChange
        >
          <InitialLoading />
          <AuthProvider>
          <BasketProvider>
          <FavoritesProvider>
          <SeminarFavoritesProvider>
          <ArticleFavoritesProvider>
          <LanguageProvider initialLocale={lang}>
          <BackendStatusProvider>
          <NavigationLoadingBoundary>
          <Suspense>
            <PageProgressBar />
          </Suspense>
          <Suspense fallback={null}>
            <UserActivityTracker />
          </Suspense>
          <PhoneVerifyNudgeListener />
          <div vaul-drawer-wrapper="" className="site-shell bg-background">
            <div className="site-shell relative flex min-h-screen flex-col bg-background">
              {siteAnnouncement ? <SiteAnnouncementBar announcement={siteAnnouncement} dir={dir} /> : null}
              <Header lang={lang as "en" || "fa"} dict={dict} />
              <div className={cn(pageLayout.container, 'py-2')}>
                <PwaInstallPrompt dict={dict} lang={lang} />
              </div>
              <main className="site-main relative flex min-h-0 flex-1 flex-col">
                <MainContentLoader />
                {children}
              </main>
              <Footer dict={dict} contactContent={contactContent} />
            </div>
          </div>
          <Toaster />
          <SiteUpdateOverlay />
          </NavigationLoadingBoundary>
          </BackendStatusProvider>
          </LanguageProvider>
          </ArticleFavoritesProvider>
          </SeminarFavoritesProvider>
          </FavoritesProvider>
          </BasketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
