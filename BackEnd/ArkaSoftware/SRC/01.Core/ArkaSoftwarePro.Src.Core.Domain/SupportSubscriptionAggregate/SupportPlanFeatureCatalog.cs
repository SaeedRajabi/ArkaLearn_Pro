namespace ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate;

public static class SupportPlanFeatureCatalog
{
    public sealed record FeatureDefinition(
        string Code,
        string TitleFa,
        string DescriptionFa,
        long DefaultAddonPriceToman,
        int SortOrder);

    public const string RemoteAssist = "RemoteAssist";
    public const string MonthlyProgressAnalytics = "MonthlyProgressAnalytics";
    public const string PortfolioProjects = "PortfolioProjects";
    public const string PrioritySupportQueue = "PrioritySupportQueue";
    public const string DedicatedMentorSessions = "DedicatedMentorSessions";
    public const string ExamRetakeCoaching = "ExamRetakeCoaching";
    public const string LiveWorkshopAccess = "LiveWorkshopAccess";
    public const string CodeReviewCredits = "CodeReviewCredits";
    public const string PersonalLearningPath = "PersonalLearningPath";
    public const string CareerPortfolioReview = "CareerPortfolioReview";

    public static IReadOnlyList<FeatureDefinition> All { get; } =
    [
        new(RemoteAssist, "کمک از راه دور (ریموت)",
            "دسترسی به سیستم کمک از راه دور و اتصال ریموت امن روی سیستم دانشجو توسط استاد/پشتیبان.",
            250_000, 1),
        new(MonthlyProgressAnalytics, "آنالیز ماهانه پیشرفت",
            "بررسی و گزارش ماهانه بر اساس میزان تلاش، تماشای ویدیوها و شرکت در آزمون‌ها.",
            180_000, 2),
        new(PortfolioProjects, "پروژه‌های نمونه‌کار + پشتیبانی VIP",
            "پروژه‌های پایانی هر ویدیو برای ساخت نمونه‌کار حرفه‌ای با پشتیبانی VIP روی تحویل پروژه.",
            220_000, 3),
        new(PrioritySupportQueue, "اولویت در صف پشتیبانی",
            "پیام‌ها و درخواست‌های پشتیبانی با اولویت بالاتر در صف پاسخ‌گویی قرار می‌گیرند.",
            120_000, 4),
        new(DedicatedMentorSessions, "جلسات منتور اختصاصی",
            "زمان‌بندی جلسات منتورینگ کوتاه و اختصاصی برای رفع اشکال عمیق‌تر مسیر یادگیری.",
            300_000, 5),
        new(ExamRetakeCoaching, "پشتیبانی آزمون و بازآزمون",
            "راهنمایی قبل از آزمون، تحلیل پاسخ‌ها و پشتیبانی ویژه برای بازگشت به آزمون‌ها.",
            150_000, 6),
        new(LiveWorkshopAccess, "کارگاه‌های زنده VIP",
            "دسترسی به جلسات کارگاه زنده و تمرین گروهی ویژه مشترکان VIP.",
            200_000, 7),
        new(CodeReviewCredits, "اعتبار ریویو کد",
            "اعتبار بررسی کد و بازخورد ساختاری توسط پشتیبان روی تکالیف و پروژه‌ها.",
            160_000, 8),
        new(PersonalLearningPath, "مسیر یادگیری شخصی‌سازی‌شده",
            "تنظیم برنامه مطالعه هفتگی بر اساس سرعت پیشرفت و نقاط ضعف/قوت دانشجو.",
            170_000, 9),
        new(CareerPortfolioReview, "بازبینی رزومه و نمونه‌کار شغلی",
            "بازخورد حرفه‌ای روی رزومه، گیت‌هاب و نمونه‌کار برای آمادگی بازار کار.",
            190_000, 10),
    ];

    public static FeatureDefinition? Find(string code) =>
        All.FirstOrDefault(x => string.Equals(x.Code, code, StringComparison.OrdinalIgnoreCase));

    public static bool IsKnown(string code) => Find(code) is not null;
}
