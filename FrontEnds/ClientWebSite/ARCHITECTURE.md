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
