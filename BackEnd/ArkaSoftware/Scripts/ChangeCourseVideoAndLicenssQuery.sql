BEGIN TRANSACTION;
GO

ALTER TABLE [Course].[CourseLesson] 
ADD [DurationSeconds] int NOT NULL DEFAULT 0;

ALTER TABLE [Course].[CourseLesson] 
ADD [SortOrder] int NOT NULL DEFAULT 0;

ALTER TABLE [Course].[CourseLesson] 
ADD [VideoPath] nvarchar(500) NULL;

ALTER TABLE [Course].[CourseLesson] 
ADD [VideoTitle] nvarchar(500) NULL;

GO
COMMIT TRANSACTION;


-- -------------------------


BEGIN TRANSACTION;
GO

-- حذف ستون‌های از نوع رشته‌ای
ALTER TABLE [Course].[CourseLesson] DROP COLUMN [VideoTitle];
ALTER TABLE [Course].[CourseLesson] DROP COLUMN [VideoPath];

-- توجه: در SQL Server به دلیل اینکه برای دو ستون زیر مقدار Default تعریف شده است (DEFAULT 0)، 
-- موتور دیتابیس برای آن‌ها Constraint می‌سازد. 
-- اگر بخواهید به صورت دستی این ستون‌ها را در SQL خام حذف کنید، ممکن است لازم باشد 
-- ابتدا Default Constraint آن‌ها را پیدا کرده و Drop کنید، اما دستور استاندارد حذف ستون به شکل زیر است:

ALTER TABLE [Course].[CourseLesson] DROP COLUMN [SortOrder];
ALTER TABLE [Course].[CourseLesson] DROP COLUMN [DurationSeconds];

GO
COMMIT TRANSACTION;

-- ----------------------------------

BEGIN TRANSACTION;
GO

-- اضافه کردن ستون‌های جدول Courses
ALTER TABLE [Course].[Courses] 
ADD [DeliveryMode] int NOT NULL DEFAULT 0;

ALTER TABLE [Course].[Courses] 
ADD [SpotPlayerCourseKey] nvarchar(100) NULL;

-- اضافه کردن ستون جدول Enrollments
ALTER TABLE [Enrollment].[Enrollments] 
ADD [SpotPlayerLicense] nvarchar(200) NULL;

GO
COMMIT TRANSACTION;



BEGIN TRANSACTION;
GO

-- حذف ستون جدول Enrollments
ALTER TABLE [Enrollment].[Enrollments] DROP COLUMN [SpotPlayerLicense];

-- حذف ستون‌های جدول Courses
ALTER TABLE [Course].[Courses] DROP COLUMN [SpotPlayerCourseKey];

-- توجه: مانند مثال قبل، چون DeliveryMode دارای مقدار پیش‌فرض (DEFAULT 0) است، 
-- SQL Server برای آن یک Constraint می‌سازد. در صورت اجرای دستی این اسکریپت و بروز خطا،
-- باید ابتدا نام Default Constraint ایجاد شده را پیدا کرده و حذف کنید، 
-- سپس دستور زیر را اجرا کنید:
ALTER TABLE [Course].[Courses] DROP COLUMN [DeliveryMode];

GO
COMMIT TRANSACTION;


BEGIN TRANSACTION;
GO

-- اضافه کردن ستون‌های جدول Courses
ALTER TABLE [Course].[Courses] 
ADD [LifecyclePhase] int NOT NULL DEFAULT 0;

ALTER TABLE [Course].[Courses] 
ADD [RegistrationDeadlineUtc] datetime2 NULL;

ALTER TABLE [Course].[Courses] 
ADD [CourseStartUtc] datetime2 NULL;

ALTER TABLE [Course].[Courses] 
ADD [CourseEndUtc] datetime2 NULL;

-- اضافه کردن ستون‌های جدول CourseLesson
ALTER TABLE [Course].[CourseLesson] 
ADD [IsPublished] bit NOT NULL DEFAULT 0;

ALTER TABLE [Course].[CourseLesson] 
ADD [PublishedAtUtc] datetime2 NULL;

GO
COMMIT TRANSACTION;


BEGIN TRANSACTION;
GO

-- حذف ستون‌های جدول CourseLesson
-- نکته: ستون IsPublished دارای مقدار پیش‌فرض (DEFAULT 0) است. 
-- در صورت بروز خطا هنگام حذف دستی، ابتدا باید Default Constraint آن را حذف کنید.
ALTER TABLE [Course].[CourseLesson] DROP COLUMN [PublishedAtUtc];
ALTER TABLE [Course].[CourseLesson] DROP COLUMN [IsPublished];


-- حذف ستون‌های جدول Courses
-- نکته: ستون LifecyclePhase نیز دارای مقدار پیش‌فرض (DEFAULT 0) است و شرایط مشابهی دارد.
ALTER TABLE [Course].[Courses] DROP COLUMN [CourseEndUtc];
ALTER TABLE [Course].[Courses] DROP COLUMN [CourseStartUtc];
ALTER TABLE [Course].[Courses] DROP COLUMN [RegistrationDeadlineUtc];
ALTER TABLE [Course].[Courses] DROP COLUMN [LifecyclePhase];

GO
COMMIT TRANSACTION;