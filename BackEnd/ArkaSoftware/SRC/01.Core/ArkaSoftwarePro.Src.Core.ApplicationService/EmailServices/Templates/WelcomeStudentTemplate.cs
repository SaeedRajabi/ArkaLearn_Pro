namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class WelcomeStudentTemplate
{
    public const string Key = EmailTemplateKeys.WelcomeStudent;
    public const string DisplayName = "خوش‌آمدگویی دانشجو";
    public const string Description = "ایمیل خوش‌آمدگویی پس از ثبت‌نام دانشجو";
    public const string Subject = "به آرکا نرم افزار خوش آمدید";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph("ثبت‌نام شما با موفقیت انجام شد. از این پس می‌توانید از دوره‌ها، سمینارها و امکانات پلتفرم استفاده کنید.") +
        EmailTemplateParts.CtaButton("{{dashboardLink}}", "ورود به پنل کاربری") +
        EmailTemplateParts.Paragraph("در صورت نیاز به راهنمایی، تیم پشتیبانی در کنار شماست.");
}
