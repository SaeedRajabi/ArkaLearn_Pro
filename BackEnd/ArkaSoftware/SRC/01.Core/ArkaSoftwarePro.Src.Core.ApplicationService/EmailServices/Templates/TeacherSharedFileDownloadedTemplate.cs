namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class TeacherSharedFileDownloadedTemplate
{
    public const string Key = EmailTemplateKeys.TeacherSharedFileDownloaded;
    public const string DisplayName = "دانلود فایل اشتراکی توسط دانشجو";
    public const string Description = "اطلاع به مدرس هنگام اولین دانلود فایل توسط دانشجو";
    public const string Subject = "دانلود فایل توسط دانشجو: {{fileTitle}}";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph(
            "دانشجو <strong>{{studentFullName}}</strong> فایل «<strong>{{fileTitle}}</strong>» را برای اولین بار دانلود کرد.") +
        EmailTemplateParts.CtaButton("{{dashboardLink}}", "مشاهده اتاق‌های آنلاین");
}

