namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class TeacherAutoBumpPurchaseTemplate
{
    public const string Key = EmailTemplateKeys.TeacherAutoBumpPurchase;
    public const string DisplayName = "خرید بسته بالابر خودکار";
    public const string Description = "تأیید خرید بسته بالابر خودکار تبلیغات";
    public const string Subject = "فعال‌سازی بسته بالابر: {{packageName}}";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph("بسته بالابر خودکار <strong>{{packageName}}</strong> فعال شد.") +
        EmailTemplateParts.InvoiceTable(
            EmailTemplateParts.InvoiceRow("بسته", "{{packageName}}") +
            EmailTemplateParts.InvoiceRow("مبلغ", "{{amountLabel}}") +
            EmailTemplateParts.InvoiceRow("تعداد بالابر", "{{bumpCount}}")) +
        EmailTemplateParts.CtaButton("{{dashboardLink}}", "مدیریت تبلیغات");
}
