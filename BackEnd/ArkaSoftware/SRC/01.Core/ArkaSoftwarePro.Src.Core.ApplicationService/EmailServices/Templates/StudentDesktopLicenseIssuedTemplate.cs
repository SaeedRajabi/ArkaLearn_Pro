namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class StudentDesktopLicenseIssuedTemplate
{
    public const string Key = EmailTemplateKeys.StudentDesktopLicenseIssued;
    public const string DisplayName = "صدور لایسنس برای دانشجو";
    public const string Description = "اطلاع به دانشجو پس از تأیید و صدور لایسنس توسط استاد";
    public const string Subject = "لایسنس دوره {{courseTitle}} صادر شد";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph(
            "دوره <strong>{{courseTitle}}</strong> توسط استاد <strong>{{teacherName}}</strong> تأیید شد.") +
        EmailTemplateParts.Paragraph(
            "لایسنس جدید با <strong>{{accessLabel}}</strong> برای شما به مدت <strong>{{durationLabel}}</strong> ایجاد شد.") +
        EmailTemplateParts.Paragraph("کد لایسنس شما:") +
        EmailTemplateParts.Paragraph("<code dir=\"ltr\">{{licenseKey}}</code>") +
        EmailTemplateParts.CtaButton("{{desktopDownloadUrl}}", "دانلود اپلیکیشن ویندوز") +
        EmailTemplateParts.CtaButton("{{accessLink}}", "مشاهده دوره‌های من");
}
