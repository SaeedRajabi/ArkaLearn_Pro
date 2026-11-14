namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class EducationPlanInstallmentDueTeacherTemplate
{
    public const string Key = EmailTemplateKeys.EducationPlanInstallmentDueTeacher;
    public const string DisplayName = "یادآوری قسط پلن — استاد";
    public const string Description = "یادآوری ایمیلی سررسید قسط دانشجو برای استاد";
    public const string Subject = "سررسید قسط {{installmentNumber}} دانشجو {{studentName}}";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph("{{dueMessage}}") +
        EmailTemplateParts.Paragraph(
            "پلن: <strong>{{planTitle}}</strong> · مبلغ: <strong>{{amountLabel}}</strong> · سررسید: <strong>{{dueDateLabel}}</strong>") +
        EmailTemplateParts.Paragraph("می‌توانید وضعیت پرداخت را از داشبورد پلن‌های آموزشی بررسی کنید.");
}
