namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class WelcomeTeacherTemplate
{
    public const string Key = EmailTemplateKeys.WelcomeTeacher;
    public const string DisplayName = "خوش‌آمدگویی مدرس";
    public const string Description = "ایمیل خوش‌آمدگویی پس از ثبت‌نام مدرس";
    public const string Subject = "به جمع مدرسان آرکا نرم افزار خوش آمدید";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph("حساب مدرس شما ایجاد شد. می‌توانید دوره‌ها و پروفایل آموزشی خود را تکمیل کنید.") +
        EmailTemplateParts.CtaButton("{{dashboardLink}}", "ورود به پنل مدرس") +
        EmailTemplateParts.Paragraph("برای شروع تدریس، پروفایل خود را تکمیل و اولین دوره را ثبت کنید.");
}
