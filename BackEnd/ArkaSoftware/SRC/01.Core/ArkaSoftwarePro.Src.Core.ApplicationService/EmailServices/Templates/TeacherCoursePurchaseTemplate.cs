namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class TeacherCoursePurchaseTemplate
{
    public const string Key = EmailTemplateKeys.TeacherCoursePurchase;
    public const string DisplayName = "خرید دوره توسط دانشجو (استاد)";
    public const string Description = "اطلاع به استاد پس از خرید و ثبت‌نام دانشجو در دوره";
    public const string Subject = "خرید جدید دوره {{courseTitle}}";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph(
            "دانشجو <strong>{{studentName}}</strong> دوره <strong>{{courseTitle}}</strong> را خریداری کرده و ثبت‌نام شده است.") +
        EmailTemplateParts.CtaButton("{{earningsLink}}", "مشاهده درآمد و فروش") +
        EmailTemplateParts.Paragraph("می‌توانید جزئیات فروش را در داشبورد مالی خود ببینید.");
}
