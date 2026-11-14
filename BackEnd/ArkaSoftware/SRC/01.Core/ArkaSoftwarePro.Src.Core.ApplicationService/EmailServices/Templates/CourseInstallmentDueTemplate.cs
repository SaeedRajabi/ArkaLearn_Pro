namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class CourseInstallmentDueTemplate
{
    public const string Key = EmailTemplateKeys.CourseInstallmentDue;
    public const string DisplayName = "یادآوری سررسید قسط دوره";
    public const string Description = "یادآوری ۲/۱/۰ روز مانده تا پرداخت قسط دوره";
    public const string Subject = "یادآوری قسط {{installmentNumber}} دوره {{courseTitle}}";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph(
            "{{dueMessage}}") +
        EmailTemplateParts.Paragraph(
            "مبلغ قسط: <strong>{{amountLabel}}</strong>") +
        EmailTemplateParts.CtaButton("{{paymentLink}}", "پرداخت قسط") +
        EmailTemplateParts.Paragraph("در صورت پرداخت قبلی، این پیام را نادیده بگیرید.");
}
