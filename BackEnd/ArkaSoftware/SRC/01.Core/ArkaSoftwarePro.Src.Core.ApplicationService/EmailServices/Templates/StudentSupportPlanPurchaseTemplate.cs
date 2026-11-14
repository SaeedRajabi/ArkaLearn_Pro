namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class StudentSupportPlanPurchaseTemplate
{
    public const string Key = EmailTemplateKeys.StudentSupportPlanPurchase;
    public const string DisplayName = "خرید پلن پشتیبانی دانشجو";
    public const string Description = "تأیید خرید اشتراک پشتیبانی";
    public const string Subject = "فعال‌سازی پلن پشتیبانی: {{planName}}";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph("پلن پشتیبانی <strong>{{planName}}</strong> با موفقیت فعال شد.") +
        EmailTemplateParts.InvoiceTable(
            EmailTemplateParts.InvoiceRow("پلن", "{{planName}}") +
            EmailTemplateParts.InvoiceRow("مبلغ", "{{amountLabel}}") +
            EmailTemplateParts.InvoiceRow("اعتبار تا", "{{expiryDate}}")) +
        EmailTemplateParts.CtaButton("{{dashboardLink}}", "ورود به پنل");
}
