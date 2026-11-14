namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class CourseOnlineAccessTemplate
{
    public const string Key = EmailTemplateKeys.CourseOnlineAccess;
    public const string DisplayName = "دسترسی آنلاین دوره";
    public const string Description = "اطلاع‌رسانی فعال‌سازی دسترسی به دوره";
    public const string Subject = "دسترسی به دوره: {{courseTitle}}";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph("دسترسی شما به دوره <strong>{{courseTitle}}</strong> فعال شد.") +
        EmailTemplateParts.CtaButton("{{accessLink}}", "مشاهده دوره") +
        EmailTemplateParts.Paragraph("در صورت بروز مشکل، با پشتیبانی تماس بگیرید.");
}
