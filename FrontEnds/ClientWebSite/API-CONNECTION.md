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
