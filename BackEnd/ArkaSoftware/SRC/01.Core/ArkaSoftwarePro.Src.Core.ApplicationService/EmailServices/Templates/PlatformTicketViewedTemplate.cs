namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class PlatformTicketViewedTemplate
{
    public const string Key = EmailTemplateKeys.PlatformTicketViewed;
    public const string DisplayName = "مشاهده تیکت پشتیبانی";
    public const string Description = "اطلاع‌رسانی به کاربر هنگام مشاهده تیکت توسط پشتیبانی";
    public const string Subject = "تیکت {{displayCode}} توسط ادمین مشاهده شد";

    public static string Body =>
        EmailTemplateParts.Greeting() +
        EmailTemplateParts.Paragraph("تیکت پشتیبانی شما توسط ادمین مشاهده شده و در حال بررسی است.") +
        EmailTemplateParts.Paragraph("کد تیکت: <strong>{{displayCode}}</strong>") +
        EmailTemplateParts.Paragraph("موضوع: {{subject}}") +
        EmailTemplateParts.Paragraph("می‌توانید از طریق دکمه زیر وضعیت تیکت را پیگیری کنید:") +
        EmailTemplateParts.CtaButton("{{ticketLink}}", "مشاهده تیکت");
}
