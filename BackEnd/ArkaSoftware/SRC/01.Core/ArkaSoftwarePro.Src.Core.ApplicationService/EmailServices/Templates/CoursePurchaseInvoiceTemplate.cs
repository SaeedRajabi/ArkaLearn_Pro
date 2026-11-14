namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class CoursePurchaseInvoiceTemplate
{
    public const string Key = EmailTemplateKeys.CoursePurchaseInvoice;
    public const string DisplayName = "فاکتور خرید دوره";
    public const string Description = "رسید ثبت‌نام یا خرید دوره (رایگان یا پولی)";
    public const string Subject = "رسید ثبت‌نام دوره: {{courseTitle}}";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph("ثبت‌نام شما در دوره <strong>{{courseTitle}}</strong> با موفقیت انجام شد.") +
        EmailTemplateParts.InvoiceTable(
            EmailTemplateParts.InvoiceRow("دوره", "{{courseTitle}}") +
            EmailTemplateParts.InvoiceRow("شماره فاکتور", "{{invoiceNumber}}") +
            EmailTemplateParts.InvoiceRow("مبلغ", "{{amountLabel}}") +
            EmailTemplateParts.InvoiceRow("کد پیگیری", "{{paymentReference}}")) +
        EmailTemplateParts.Paragraph("از همراهی شما سپاسگزاریم.");
}
