namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class EducationPlanInstallmentDueStudentTemplate
{
    public const string Key = EmailTemplateKeys.EducationPlanInstallmentDueStudent;
    public const string DisplayName = "یادآوری قسط پلن — دانشجو";
    public const string Description = "یادآوری سررسید قسط پلن آموزشی خصوصی به دانشجو";
    public const string Subject = "یادآوری قسط {{installmentNumber}} پلن {{planTitle}}";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph("{{dueMessage}}") +
        EmailTemplateParts.Paragraph(
            "مبلغ قسط: <strong>{{amountLabel}}</strong> · تاریخ سررسید: <strong>{{dueDateLabel}}</strong>") +
        EmailTemplateParts.CtaButton("{{paymentLink}}", "پرداخت قسط") +
        EmailTemplateParts.Paragraph("در صورت پرداخت قبلی، این پیام را نادیده بگیرید.");
}
