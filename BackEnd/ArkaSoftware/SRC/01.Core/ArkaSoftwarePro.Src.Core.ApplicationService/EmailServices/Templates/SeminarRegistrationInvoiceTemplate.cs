namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class SeminarRegistrationInvoiceTemplate
{
    public const string Key = EmailTemplateKeys.SeminarRegistrationInvoice;
    public const string DisplayName = "فاکتور ثبت‌نام سمینار";
    public const string Description = "رسید ثبت‌نام سمینار";
    public const string Subject = "رسید ثبت‌نام سمینار: {{seminarTitle}}";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph("ثبت‌نام شما در سمینار <strong>{{seminarTitle}}</strong> با موفقیت انجام شد.") +
        EmailTemplateParts.InvoiceTable(
            EmailTemplateParts.InvoiceRow("سمینار", "{{seminarTitle}}") +
            EmailTemplateParts.InvoiceRow("مبلغ", "{{amountLabel}}") +
            EmailTemplateParts.InvoiceRow("کد پیگیری", "{{paymentReference}}")) +
        EmailTemplateParts.Paragraph("جزئیات دسترسی آنلاین در ایمیل جداگانه ارسال می‌شود.");
}
