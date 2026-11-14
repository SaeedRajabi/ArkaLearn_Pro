# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## اجرای داشبورد با HTTPS (برای کار کردن کوکی لاگین)

کوکی احراز هویت در بک‌اند با `Secure=true` ست می‌شود؛ برای اینکه بعد از لاگین و رفرش از داشبورد خارج نشوید، داشبورد و ترجیحاً API هر دو روی HTTPS باشند.

1. **ساخت گواهی SSL** (یک بار، در روت پروژه):
   ```bash
   npm install
   npm run generate-certs
   ```
   فایل‌های `localhost+2-key.pem` و `localhost+2.pem` در روت داشبورد ساخته می‌شوند.

2. **اجرای داشبورد با HTTPS:**
   ```bash
   npm run dev:https
   ```
   داشبورد روی **https://localhost:4001** بالا می‌آید.

3. **API:** اگر بک‌اند روی `http://localhost:5001` باشد، مرورگر ممکن است کوکی را ذخیره نکند و بعد از رفرش به لاگین برگردید. در توسعه می‌توانید API را هم با HTTPS اجرا کنید یا در بک‌اند برای محیط توسعه کوکی را بدون `Secure` ست کنید.
