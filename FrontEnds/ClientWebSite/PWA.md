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
