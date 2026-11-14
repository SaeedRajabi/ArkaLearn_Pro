namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class CourseEnrollmentLicenseTemplate
{
    public const string Key = EmailTemplateKeys.CourseEnrollmentLicense;
    public const string DisplayName = "ثبت‌نام دوره و لایسنس دسکتاپ";
    public const string Description = "اطلاع ثبت‌نام در دوره به‌همراه کد لایسنس و لینک دانلود اپلیکیشن ویندوز";
    public const string Subject = "ثبت‌نام در دوره {{courseTitle}} — کد لایسنس شما";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph(
            "شما در دوره <strong>{{courseTitle}}</strong> استاد <strong>{{teacherName}}</strong> ثبت‌نام کرده‌اید.") +
        EmailTemplateParts.Paragraph(
            "برای دسترسی به ویدیوها از کد لایسنس زیر در اپلیکیشن ویندوز استفاده کنید:") +
        EmailTemplateParts.Paragraph("<code dir=\"ltr\">{{licenseKey}}</code>") +
        EmailTemplateParts.CtaButton("{{desktopDownloadUrl}}", "دانلود اپلیکیشن ویندوز") +
        EmailTemplateParts.CtaButton("{{accessLink}}", "مشاهده دوره در سایت") +
        EmailTemplateParts.Paragraph("در صورت بروز مشکل، با پشتیبانی تماس بگیرید.");
}
