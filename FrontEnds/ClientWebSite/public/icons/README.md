# آیکون‌های PWA

## تصویر پیش‌فرض مدرک تحصیلی

فایل **`certificate-default-image.png`** در همین پوشه (`public/icons/`) وقتی استاد برای مدرک/گواهینامه تصویر آپلود نکرده باشد، به‌صورت پیش‌فرض در پروفایل عمومی و فرم ویرایش استاد نمایش داده می‌شود.

---

## تصویر پیش‌فرض سربرگ داشبورد

فایل **`Dashboard_Header.jpg`** در همین پوشه (`public/icons/`) به‌صورت پیش‌فرض برای سربرگ داشبورد استاد و دانشجو استفاده می‌شود. کاربران می‌توانند از دکمه «تغییر تصویر سربرگ» در داشبورد آن را شخصی‌سازی کنند.

---

برای نصب PWA روی موبایل و دسکتاپ، آیکون‌های زیر لازم هستند.

## روش ۱: تولید خودکار (توصیه می‌شود)

روی **Linux یا macOS** (یا WSL در ویندوز):

```bash
npm install -D sharp
node scripts/generate-pwa-icons.js
```

روی ویندوز در صورت خطای sharp:

```bash
npm install --include=optional sharp
node scripts/generate-pwa-icons.js
```

## روش ۲: ساخت دستی

از فایل `logo.svg` در همین پوشه با ابزارهایی مثل [realfavicongenerator.net](https://realfavicongenerator.net/) یا [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) خروجی PNG بگیرید و با نام‌های زیر ذخیره کنید:

| نام فایل | سایز |
|----------|------|
| icon-72x72.png | 72×72 |
| icon-96x96.png | 96×96 |
| icon-128x128.png | 128×128 |
| icon-144x144.png | 144×144 |
| icon-152x152.png | 152×152 |
| icon-192x192.png | 192×192 |
| icon-384x384.png | 384×384 |
| icon-512x512.png | 512×512 |
| icon-maskable-192x192.png | 192×192 (با حاشیه امن برای maskable) |
| icon-maskable-512x512.png | 512×512 (با حاشیه امن برای maskable) |

حداقل برای نصب PWA: **icon-192x192.png** و **icon-512x512.png** کافی است.
