namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class ExamAssignedTemplate
{
    public const string Key = EmailTemplateKeys.ExamAssigned;
    public const string DisplayName = "ثبت آزمون جدید برای دانشجو";
    public const string Description = "ایمیل به دانشجو هنگامی که استاد آزمون جدیدی برای او ثبت می‌کند (شامل استاد، عنوان، توضیحات، سطح، مدت و مهلت پاسخ)";
    public const string Subject = "آزمون «{{examTitle}}» توسط استاد {{professorName}} برای شما ثبت شد";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph(
            "استاد <strong>{{professorName}}</strong> یک آزمون جدید با عنوان «<strong>{{examTitle}}</strong>» برای شما ثبت کرد.") +
        EmailTemplateParts.Paragraph("{{examDescription}}") +
        EmailTemplateParts.Paragraph(
            "سطح آزمون: <strong>{{levelLabel}}</strong> · مدت پاسخ‌دهی: <strong>{{durationLabel}}</strong> · مهلت پایان: <strong>{{deadlineLabel}}</strong>") +
        EmailTemplateParts.CtaButton("{{examsLink}}", "مشاهده آزمون‌های من") +
        EmailTemplateParts.Paragraph(
            "برای پاسخ‌دهی، پیش از پایان مهلت وارد پنل دانشجویی خود شوید. در صورت نیاز با استاد یا پشتیبانی آرکا نرم‌افزار در ارتباط باشید.");
}
