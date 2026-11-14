# رفع مانع مجوز پردازش تصویر

تاریخ: ۱۱ نوامبر ۲۰۲۶

با اعلام نبود کلید Six Labors، وابستگی `SixLabors.ImageSharp` از دو پروژه بک‌اند حذف و بررسی ابعاد تصویر به `SkiaSharp 4.155.0` منتقل شد. ساخت Release اکنون بدون کلید Six Labors موفق است. مجوز AutoMapper همچنان مستقل از این تغییر است.

## تغییر رفتار

تنها استفاده مستقیم ImageSharp در کد بک‌اند، تابع `HaveValidDimensionsExtension` بود. این تابع اکنون Stream و Codec را Dispose می‌کند، ابعاد مثبت و سقف ۶۰۰ پیکسل در هر محور را پیش از ایجاد بافر پیکسل بررسی می‌کند و Decode موفق تصویر را نیز لازم می‌داند. ورودی خالی، داده غیرتصویری و نمونه ناقص PNG رد می‌شوند. فرمت‌های PNG، JPEG، GIF و WebP با آزمون اجرا شده‌اند؛ این تابع تضمین پشتیبانی همه فرمت‌های ImageSharp را ارائه نمی‌کند.

SkiaSharp با مجوز MIT عرضه می‌شود. بسته `SkiaSharp.NativeAssets.Linux.NoDependencies` هم برای انتشار API روی Linux اضافه شده است؛ آزمون‌های این مرحله روی Windows اجرا شده‌اند و بارگذاری کتابخانه بومی در محیط Linux باید در Staging بررسی شود.

در Restore مجدد، دو هشدار جدید در وابستگی‌های قدیمی ASP.NET مشاهده شد. منشأ آن‌ها ارجاع `Microsoft.AspNetCore.SignalR 1.2.0` در ApplicationService بود. این ارجاع با `FrameworkReference` به `Microsoft.AspNetCore.App` جایگزین شد. مصرف Newtonsoft.Json در همان پروژه نیز با ارجاع صریح `13.0.3` ثبت شد تا به وابستگی جانبی بسته قدیمی متکی نباشد.

## شواهد اعتبارسنجی

- Restore موفق؛ هیچ `NU19xx` در گزارش Restore پروژه‌های بررسی‌شده وجود ندارد. هشدار قبلی `NU1608` مربوط به وابستگی Parrot/AutoMapper همچنان ثبت می‌شود.
- ساخت کامل Solution با `-c Release --no-restore` موفق؛ صفر خطا. هشدارهای قبلی کامپایل باقی‌اند.
- آزمون‌های خروجی Release: ۸۲ موفق، صفر شکست و چهار SMTP اجرا‌نشده. ۱۱ آزمون تازه، ابعاد تصویر و فرمت‌ها و ورودی نامعتبر را پوشش می‌دهند.
- ImageSharp و SignalR قدیمی در فایل‌های `project.assets.json` حل‌شده بک‌اند وجود ندارند.
- نتیجه ماشین‌خوان در `backend-verification.json`، خروجی ساخت در `backend-hardening-release.log` و نتایج آزمون در `backend-hardening-tests.log` ثبت شده‌اند.

## پیش‌نیاز امنیتی سرور

حذف هشدارهای بسته‌های NuGet، Runtime نصب‌شده را به‌روز نمی‌کند. طبق اطلاعیه امنیتی ASP.NET Core منتشرشده در ۱۰ نوامبر ۲۰۲۶، شاخه ۹ به `9.0.23` و شاخه ۱۰ به `10.0.15` نیاز دارد. Runtimeهای موجود روی این ماشین حداکثر `9.0.18` و `10.0.10` بودند؛ نصب Runtime یا Hosting Bundle سیستم در این مرحله انجام نشده است. این مورد باید پیش از انتشار عملیاتی رسیدگی شود.

کلیدهای رمزنگاری، Migration جدول پرداخت، تطبیق تاریخچه Migrationهای قدیمی، آزمون واقعی اتاق‌ها و درگاه پرداخت نیز مطابق گزارش اصلی، پیش‌نیاز استقرار باقی مانده‌اند. هیچ انتشار یا تغییر دیتابیس عملیاتی انجام نشده است.

## منابع رسمی بررسی‌شده

- مجوز SkiaSharp: `https://github.com/mono/SkiaSharp/blob/main/LICENSE.txt`
- بسته SkiaSharp: `https://www.nuget.org/packages/SkiaSharp/4.155.0`
- الزام کلید در ImageSharp 3.2: `https://docs-v3.sixlabors.com/articles/imagesharp/index.html`
- FrameworkReference در کتابخانه‌های ASP.NET Core: `https://learn.microsoft.com/en-us/aspnet/core/fundamentals/target-aspnetcore?view=aspnetcore-9.0`
- اطلاعیه امنیتی Runtime: `https://github.com/advisories/GHSA-67wp-ghc2-fw2g`
- هشدار WebUtilities: `https://github.com/advisories/GHSA-6527-9fp8-r4x6`
