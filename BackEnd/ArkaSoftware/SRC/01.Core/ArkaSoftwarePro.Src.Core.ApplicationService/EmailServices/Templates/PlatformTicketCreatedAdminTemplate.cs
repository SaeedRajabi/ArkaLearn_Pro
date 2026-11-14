namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class PlatformTicketCreatedAdminTemplate
{
    public const string Key = EmailTemplateKeys.PlatformTicketCreatedAdmin;
    public const string DisplayName = "تیکت پشتیبانی جدید (ادمین)";
    public const string Description = "اطلاع‌رسانی به ادمین هنگام ثبت تیکت پشتیبانی جدید";
    public const string Subject = "تیکت جدید {{displayCode}} از {{requesterName}}";

    public static string Body =>
        EmailTemplateParts.Greeting() +
        EmailTemplateParts.Paragraph("یک تیکت پشتیبانی جدید در سایت ثبت شده است.") +
        EmailTemplateParts.Paragraph("ارسال‌کننده: <strong>{{requesterName}}</strong>") +
        EmailTemplateParts.Paragraph("کد تیکت: <strong>{{displayCode}}</strong>") +
        EmailTemplateParts.Paragraph("موضوع: {{subject}}") +
        EmailTemplateParts.Paragraph("خلاصه پیام: {{messagePreview}}") +
        EmailTemplateParts.Paragraph("برای مشاهده و پاسخ‌گویی روی دکمه زیر کلیک کنید:") +
        EmailTemplateParts.CtaButton("{{adminTicketLink}}", "مشاهده تیکت");
}
