namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class TeacherDesktopLicenseRequestTemplate
{
    public const string Key = EmailTemplateKeys.TeacherDesktopLicenseRequest;
    public const string DisplayName = "درخواست لایسنس دسکتاپ (استاد)";
    public const string Description = "اطلاع به استاد وقتی دانشجو درخواست صدور لایسنس می‌دهد";
    public const string Subject = "درخواست لایسنس — {{courseTitle}}";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph(
            "دانشجو <strong>{{studentName}}</strong> دوره <strong>{{courseTitle}}</strong> را خریداری کرده و درخواست صدور لایسنس دسکتاپ دارد.") +
        EmailTemplateParts.CtaButton("{{studentsLink}}", "صدور لایسنس برای دانشجو") +
        EmailTemplateParts.Paragraph("پس از صدور لایسنس، دانشجو از طریق ایمیل و اعلان مطلع خواهد شد.");
}
