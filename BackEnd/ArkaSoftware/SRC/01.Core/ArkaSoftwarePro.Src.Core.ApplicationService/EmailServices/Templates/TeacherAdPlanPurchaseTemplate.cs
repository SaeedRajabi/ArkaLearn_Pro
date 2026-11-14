namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class TeacherAdPlanPurchaseTemplate
{
    public const string Key = EmailTemplateKeys.TeacherAdPlanPurchase;
    public const string DisplayName = "خرید پلن تبلیغات مدرس";
    public const string Description = "تأیید خرید اشتراک تبلیغات";
    public const string Subject = "فعال‌سازی پلن تبلیغات: {{planName}}";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph("پلن تبلیغات <strong>{{planName}}</strong> با موفقیت فعال شد.") +
        EmailTemplateParts.InvoiceTable(
            EmailTemplateParts.InvoiceRow("پلن", "{{planName}}") +
            EmailTemplateParts.InvoiceRow("مبلغ", "{{amountLabel}}") +
            EmailTemplateParts.InvoiceRow("اعتبار تا", "{{expiryDate}}")) +
        EmailTemplateParts.CtaButton("{{dashboardLink}}", "مدیریت تبلیغات");
}
