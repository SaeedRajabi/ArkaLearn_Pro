// src/seo/keywords.ts
export const SEO_KEYWORDS_FA: string[] = [
    // عمومی
    'آموزش برنامه نویسی',
    'یادگیری برنامه نویسی',
    'آموزش آنلاین برنامه نویسی',
    'دوره برنامه نویسی',
    'آموزش توسعه نرم افزار',
    'آموزش برنامه نویسی از صفر',
    'آموزش پروژه محور',
    'آموزش تخصصی برنامه نویسی',
    'آموزش رایگان برنامه نویسی',
    'مسیر یادگیری برنامه نویسی',
    'تمرین برنامه نویسی',
    'پروژه های برنامه نویسی',
    'بهترین دوره برنامه نویسی',
    'ورود به بازار کار برنامه نویسی',
    'آموزش برای بازار کار',
    'کدنویسی',
    'برنامه نویس شدن',
    'برنامه نویس',
    'برنامه نویس برتر',
    'سعید رجبی',
    'Saeed Rajabi',
    'آرکا نرم افزار',
    'Arka Norm Software',
    'ArkaSoftware',

    // وب
    'آموزش برنامه نویسی وب',
    'طراحی سایت',
    'توسعه وب',
    'فرانت اند',
    'بک اند',
    'فول استک',
    'آموزش API',
    'REST API',
    'GraphQL',

    // دات نت و C#
    'آموزش سی شارپ',
    'آموزش C#',
    'آموزش دات نت',
    'آموزش ASP.NET Core',
    'آموزش Web API',
    'Entity Framework Core',
    'EF Core',
    'Clean Architecture',
    'DDD',
    'Domain Driven Design',
    'CQRS',
    'MediatR',
    'SignalR',

    // جاوااسکریپت/فرانت
    'آموزش جاوااسکریپت',
    'آموزش TypeScript',
    'آموزش React',
    'آموزش Next.js',
    'آموزش Redux',
    'Tailwind CSS',
    'Bootstrap',

    // دیتابیس
    'آموزش SQL',
    'SQL Server',
    'آموزش پایگاه داده',
    'طراحی دیتابیس',
    'Oracle',
    'MongoDB',
    'Redis',

    // پایتون/داده
    'آموزش پایتون',
    'آموزش Python',
    'علوم داده',
    'Data Science',
    'یادگیری ماشین',
    'Machine Learning',
    'هوش مصنوعی',
    'AI',
    'تحلیل داده',
];

export const SEO_KEYWORDS_EN: string[] = [
    'programming courses',
    'learn programming',
    'online programming courses',
    'coding tutorials',
    'software development',
    'project based learning',
    'best programming course',
    'job ready programming',
    'become a developer',
    'programmer',
    'top programmer',
    'software programmer',
    'saeed rajabi',
    'Saeed Rajabi',
    'SaeedRa',
    'Arka Norm Software',
    'ArkaSoftware',
    'Arka Software',

    // web
    'web development',
    'frontend development',
    'backend development',
    'full stack development',
    'API development',
    'REST API',
    'GraphQL',

    // JS stack
    'JavaScript',
    'TypeScript',
    'React',
    'Next.js',
    'Redux',
    'Tailwind CSS',
    'Bootstrap',

    // .NET
    'C#',
    '.NET',
    'ASP.NET Core',
    'Web API',
    'Entity Framework Core',
    'Clean Architecture',
    'DDD',
    'CQRS',
    'MediatR',
    'SignalR',

    // DB
    'SQL',
    'SQL Server',
    'Oracle',
    'MongoDB',
    'Redis',

    // Data/AI
    'Python',
    'Data Science',
    'Machine Learning',
    'Artificial Intelligence',
];

export function getMergedKeywords(extra?: string[]): string[] {
    const merged = [...SEO_KEYWORDS_FA, ...SEO_KEYWORDS_EN, ...(extra ?? [])];

    // حذف تکراری‌ها + تمیزکاری
    const unique = Array.from(
        new Set(
            merged
                .map(x => x.trim())
                .filter(Boolean)
        )
    );

    // Google limit مشخصی اعلام نکرده، اما بهتره خیلی بزرگ نشه
    // (اینجا نهایتاً 80 تا نگه می‌داریم)
    return unique.slice(0, 80);
}