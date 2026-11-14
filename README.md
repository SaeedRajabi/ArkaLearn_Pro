# معماری پروژه ArkaLearn (Client-Side Architecture)

این سند معماری و چیدمان کدهای پروژه را بر اساس اصول **Feature-Based** و **Layered Architecture** برای پروژه‌های React/Next.js توضیح می‌دهد.

---

## اصول معماری

### ۱. Feature-Based Organization
کامپوننت‌ها و منطق مرتبط با هر **فیچر/دامین** در یک پوشه متمرکز می‌شوند تا:
- **Cohesion** بالا: کدهای مرتبط کنار هم باشند
- **Coupling** پایین: وابستگی بین فیچرها کاهش یابد
- **Scalability**: افزودن فیچر جدید ساده باشد
- **Discoverability**: پیدا کردن کد مرتبط با یک قابلیت آسان باشد

### ۲. Separation of Concerns
- **Presentation**: کامپوننت‌های UI
- **Data/State**: داده‌ها، APIها و state management
- **Business Logic**: سرویس‌ها و actions
- **Shared/Core**: utilityها، انواع تایپ و ثابت‌ها

### ۳. قاعده وابستگی (Dependency Rule)
- لایه‌های بالاتر (مثلاً components) به لایه‌های پایین‌تر (lib, types) وابسته‌اند
- لایه‌های پایین به لایه‌های بالا وابسته نیستند
- Shared code نباید به Feature-specific code وابسته باشد

---

## ساختار پوشه‌ها

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # صفحه اصلی
│   ├── globals.css
│   │
│   ├── courses/                  # فیچر: دوره‌ها
│   │   ├── page.tsx
│   │   └── [slug]/
│   │       ├── page.tsx
│   │       └── loading.tsx
│   │
│   ├── seminars/                 # فیچر: سمینارها
│   ├── articles/                 # فیچر: مقالات
│   ├── about/                    # صفحه درباره ما
│   ├── checkout/                 # فیچر: پرداخت
│   │
│   ├── login/                    # فیچر: احراز هویت
│   ├── register/
│   └── forgot-password/
│
├── components/
│   │
│   ├── ui/                       # Design System - کامپوننت‌های پایه
│   │   └── button.tsx, input.tsx, card.tsx, ...
│   │
│   ├── layout/                   # لایه‌های صفحه
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── index.ts
│   │
│   ├── shared/                   # کامپوننت‌های مشترک در چند فیچر
│   │   ├── logo.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── theme-provider.tsx
│   │   ├── theme-switcher.tsx
│   │   ├── language-switcher.tsx
│   │   ├── page-progress-bar.tsx
│   │   ├── loading-overlay.tsx
│   │   ├── blob-bg.tsx
│   │   └── index.ts
│   │
│   ├── icons/                    # آیکون‌های سفارشی
│   │   ├── react-logo.tsx
│   │   ├── youtube-icon.tsx
│   │   └── ...
│   │
│   └── features/                 # کامپوننت‌های مختص هر فیچر
│       │
│       ├── home/                 # صفحه اصلی
│       │   ├── hero.tsx
│       │   ├── content-tabs.tsx
│       │   ├── seminars-carousel.tsx
│       │   ├── articles-section.tsx
│       │   └── index.ts
│       │
│       ├── courses/
│       │   ├── course-card.tsx
│       │   ├── course-list-item.tsx
│       │   ├── course-reviews.tsx
│       │   ├── courses-page-client.tsx
│       │   └── index.ts
│       │
│       ├── seminars/
│       │   ├── seminar-card.tsx
│       │   ├── seminar-list-item.tsx
│       │   ├── seminars-page-client.tsx
│       │   └── index.ts
│       │
│       ├── articles/
│       │   ├── article-card.tsx
│       │   ├── article-comments.tsx
│       │   ├── article-engagement-bar.tsx
│       │   ├── articles-page-client.tsx
│       │   └── index.ts
│       │
│       ├── auth/
│       │   ├── login-page-client.tsx
│       │   ├── register-page-client.tsx
│       │   ├── forgot-password-page-client.tsx
│       │   └── index.ts
│       │
│       └── checkout/
│           ├── checkout-page-client.tsx
│           └── index.ts
│
├── lib/                          # کتابخانه‌های مشترک و سرویس‌ها
│   ├── utils.ts                  # توابع کمکی
│   ├── i18n.ts                   # بین‌المللی‌سازی
│   ├── actions.ts                # Server Actions
│   ├── locales/
│   │   ├── en.json
│   │   └── fa.json
│   └── constants/
│       └── placeholder-images.ts
│
├── types/                        # تعاریف TypeScript (جدا از lib)
│   └── index.ts                  # Course, Article, Seminar, Dictionary, ...
│
├── data/                         # داده‌های Mock / API responses
│   └── index.ts                  # courses, articles, seminars
│
├── hooks/                        # Custom Hooks مشترک
│   ├── use-toast.ts
│   ├── use-pagination.ts
│   └── use-mobile.tsx
│
└── ai/                           # جریان‌های AI (Genkit)
    ├── genkit.ts
    ├── dev.ts
    └── flows/
```

---

## قواعد نام‌گذاری و قراردادها

### فایل‌ها
- **کامپوننت‌ها**: `kebab-case.tsx` (مثال: `course-card.tsx`)
- **هوک‌ها**: `use-*.ts` یا `use-*.tsx`
- **تایپ‌ها**: `index.ts` در پوشه types یا نام دامنه مثل `course.types.ts`

### Import Paths
استفاده از alias `@/` برای مسیرهای مطلق:
```ts
import { CourseCard } from '@/components/features/courses';
import type { Course } from '@/types';
import { courses } from '@/data';
import { cn } from '@/lib/utils';
```

### کامپوننت‌های Client vs Server
- کامپوننت‌هایی که از `useState`, `useEffect` یا event handler استفاده می‌کنند: `'use client'`
- صفحه‌های App Router به‌صورت پیش‌فرض Server Component اند
- کامپوننت‌های `*-page-client.tsx` برای منطق سمت کلاینت در صفحات استفاده می‌شوند

---

## جریان داده (Data Flow)

```
Server (App Router)          Client Components
       │                              │
       │  cookies(), getDictionary()  │
       │  data fetching               │
       │                              │
       ▼                              ▼
   Page (Server)  ──props──▶  PageClient / Feature Components
                                    │
                                    │  hooks, local state
                                    ▼
                              UI Components (ui/, shared/)
```

---

## افزودن فیچر جدید

1. ایجاد پوشه در `components/features/{feature-name}/`
2. ایجاد کامپوننت‌ها و `index.ts` برای barrel export
3. در صورت نیاز اضافه کردن route در `app/{feature}/`
4. اضافه کردن تایپ‌ها به `types/` و داده‌ها به `data/` در صورت نیاز

---

## نکات نگهداری

- **DRY**: منطق تکراری را در lib، hooks یا shared components قرار دهید
- **Single Responsibility**: هر فایل یک مسئولیت مشخص داشته باشد
- **Barrel Exports**: از `index.ts` در هر پوشه فیچر برای export مرکزی استفاده کنید
- **Colocation**: فایل‌های تست و استایل در کنار کامپوننت مربوط قرار گیرند (در صورت نیاز)

---

## وضعیت پیاده‌سازی فعلی

✅ **انجام شده:**
- `types/` – تعاریف TypeScript
- `lib/constants/` – ثابت‌ها (placeholder-images)
- `data/` – barrel برای داده‌ها
- `components/layout/` – Header و Footer
- `components/shared/` – Logo، Breadcrumb، ThemeProvider، ThemeSwitcher، LanguageSwitcher، PageProgressBar، LoadingOverlay، BlobBg
- `components/features/home/` – barrel برای Hero، ContentTabs، SeminarsCarousel، ArticlesSection

⏳ **برای تکمیل (اختیاری):**
- انتقال فیزیکی کامپوننت‌های hero، content-tabs و غیره به داخل `features/home/`
- ایجاد `features/courses/`، `features/seminars/`، `features/articles/`، `features/auth/`، `features/checkout/`
- انتقال داده‌ها از `lib/data.ts` به `data/index.ts`


# اتصال فرانت به API بک‌اند

## تنظیم آدرس API

در ریشه پروژه فرانت (`ClientWebSite`) فایل `.env` یا `.env.local` بسازید و آدرس پایه API را قرار دهید:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

- پورت را مطابق پروژه بک‌اند تنظیم کنید (مثلاً 5000 یا 5001).
- اگر این متغیر خالی باشد یا ست نشود، فرانت از **دادهٔ Mock** داخل `lib/data` استفاده می‌کند و خطا نمی‌دهد.

## مسیرهای استفاده‌شده در فرانت

| منبع فرانت        | متد و مسیر بک‌اند |
|--------------------|--------------------|
| لیست دوره‌ها       | `GET api/Service/Course/Search` و `GetAllPopular` |
| جزئیات دوره       | `GET api/Service/Course/GetById?courseId=` |
| لیست مقالات       | `GET api/Service/Article/Search` |
| جزئیات مقاله      | `GET api/Service/Article/GetBySlug?slug=` |
| لیست سمینارها     | `GET api/Service/Seminar/Search` |
| جزئیات سمینار     | `GET api/Service/Seminar/GetById?id=` |
| لاگین             | `POST api/Service/Account/Login` |
| خروج              | `POST api/Service/Account/Logout` |

درخواست‌ها با `credentials: 'include'` ارسال می‌شوند تا کوکی احراز هویت به بک‌اند برود.

## ساختار کد فرانت

- **`src/lib/api/`**: کلاینت HTTP، تایپ‌های پاسخ، سرویس‌های courses/articles/seminars/account و آداپترها (تبدیل DTO به نوع فرانت).
- **`src/lib/data-server.ts`**: توابع `getCoursesList`, `getCourseById`, `getArticlesList`, `getArticleBySlug`, `getSeminarsList`, `getSeminarById`, `getPopularCourses`, `getUpcomingSeminars` برای استفاده در Server Components. در صورت نبودن یا خطای API، به داده Mock برمی‌گردند.

## دوره و سمینار: شناسه عددی در URL

جزئیات دوره و سمینار در بک‌اند با **شناسه عددی** (`CourseId`, `Id`) کار می‌کنند. در فرانت همان عدد به‌صورت رشته در مسیر استفاده می‌شود، مثلاً `/courses/1` و `/seminars/2`. مقدار `slug` در نوع فرانت برای این دو برابر همان `id` است تا لینک‌ها یکسان باشند.

## CORS

بک‌اند با پالیسی CORS فعلی (مثلاً AllowAll) اجازه درخواست از مبدا فرانت را می‌دهد. اگر فرانت روی پورت دیگری (مثلاً 9002) اجرا شود، همان پورت به‌عنوان Origin ارسال می‌شود و باید در CORS بک‌اند مجاز باشد.


# IIS Deployment (Next.js Standalone)

## Why the app was stuck on loading

If the browser logs show many `404` errors for `/_next/static/chunks/*.js`, the deployment is incomplete.

For `output: 'standalone'`, you must deploy all of these together:

1. `.next/standalone/*`
2. `.next/static/*` (copied into `.next/standalone/.next/static`)
3. `public/*` (copied into `.next/standalone/public`)
4. `web.config` (in the deployed root next to `server.js`)

If only `.next/standalone` is deployed, HTML may load but JS chunks fail with 404 and the page stays on the loading screen.

## Recommended build command (for IIS package)

Run in project root:

```powershell
npm.cmd ci
npm.cmd run build:iis
```

This creates a ready-to-deploy folder:

```text
.iis-dist\
```

Upload the contents of `.iis-dist` to your IIS site root.

`build:iis` also removes stale `public/robots.txt` and `public/sitemap*.xml` files before build, so your `app/robots.ts` and `app/sitemap.ts` remain the single source of truth.

## Environment variables (Production)

Set these in IIS (Site/Application -> Configuration Editor / system.webServer/aspNetCore env vars, or system env vars), or place an `.env` file in deploy root:

```env
NODE_ENV=production
PORT=3000
HOSTNAME=127.0.0.1
NEXT_PUBLIC_SITE_URL=https://arkasoftware.ir
NEXT_PUBLIC_API_URL=https://api.arkasoftware.ir
# Optional temporary troubleshooting switch:
# NEXT_PUBLIC_DISABLE_PWA=true
```

## IIS prerequisites

Install on the server:

1. Node.js LTS
2. IIS URL Rewrite Module
3. iisnode (for running `server.js` under IIS)

IIS site settings:

1. Application Pool: `No Managed Code`
2. Pipeline mode: `Integrated`
3. 64-bit enabled
4. Site bindings:
   - `https://arkasoftware.ir` (443)
   - `https://www.arkasoftware.ir` (443) (optional, for redirect)
   - `http://arkasoftware.ir` (80) (optional, for redirect)
   - `http://www.arkasoftware.ir` (80) (optional, for redirect)

## What `web.config` handles

The included `web.config`:

1. Redirects `www` -> apex (`arkasoftware.ir`)
2. Redirects `http` -> `https`
3. Redirects `index.html` -> `/`
4. Redirects `:8443` -> normal HTTPS (443)
5. Routes all requests to Next.js `server.js` via `iisnode`
6. Preserves Next.js custom 404 responses

## After each deployment (important for PWA)

Because service-worker caching is enabled, do this after deploy:

1. Hard refresh (`Ctrl+F5`)
2. If still broken, unregister the service worker and clear site storage
3. Reopen the site

If you need to quickly verify deployment without PWA caching interference, set:

```env
NEXT_PUBLIC_DISABLE_PWA=true
```

Then rebuild and redeploy.


# راهنمای PWA

این پروژه به‌صورت **Progressive Web App (PWA)** پیکربندی شده و روی موبایل و دسکتاپ قابل نصب است.

## قابلیت‌ها

- **نصب روی دستگاه**: از طریق منوی مرورگر یا بنر «نصب اپ»
- **حالت standalone**: اجرا بدون نوار آدرس مرورگر
- **کش و آفلاین**: Service Worker برای کش صفحات و نمایش صفحه آفلاین در صورت قطع اینترنت
- **مانیفست**: نام، آیکون، رنگ تم و شورتکات‌ها (دوره‌ها، سمینارها، مقالات)
- **سازگاری با iOS**: متا تگ‌های `apple-mobile-web-app-*` و `apple-touch-icon`

## آیکون‌ها

برای اینکه نصب PWA و آیکون اپ درست کار کند، باید آیکون‌های PNG در `public/icons/` قرار بگیرند:

1. **خودکار (در محیطی که sharp نصب شود):**
   ```bash
   npm run pwa:icons
   ```
2. **دستی:** طبق راهنمای `public/icons/README.md` آیکون‌های ۱۹۲ و ۵۱۲ را اضافه کنید.

## تست

1. **پروداکشن:** ابتدا `npm run build` و سپس `npm run start`. PWA در حالت development غیرفعال است.
2. **Chrome:** در DevTools > Application > Manifest و Service Worker را بررسی کنید.
3. **موبایل:** سایت را با HTTPS باز کنید و از منو گزینه «نصب اپ» یا «Add to Home Screen» را بزنید.

## فایل‌های مرتبط

- `public/manifest.json` — مانیفست PWA
- `next.config.ts` — پلاگین `@ducanh2912/next-pwa`
- `src/app/offline/page.tsx` — صفحه نمایش در حالت آفلاین
- `src/components/shared/pwa-install-prompt.tsx` — بنر پیشنهاد نصب
