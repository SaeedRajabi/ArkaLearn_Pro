namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class ExamSubmittedTeacherTemplate
{
    public const string Key = EmailTemplateKeys.ExamSubmittedTeacher;
    public const string DisplayName = "شرکت دانشجو در آزمون (ایمیل به استاد)";
    public const string Description = "ایمیل به استاد هنگامی که دانشجو آزمون را تحویل می‌دهد (شامل نام دانشجو، عنوان آزمون، مدت پاسخ‌دهی و تعداد سوالات)";
    public const string Subject = "دانشجو {{studentName}} در آزمون «{{examTitle}}» شرکت کرد";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph(
            "دانشجو <strong>{{studentName}}</strong> آزمون «<strong>{{examTitle}}</strong>» را تکمیل و تحویل داد.") +
        EmailTemplateParts.Paragraph(
            "مدت پاسخ‌دهی: <strong>{{durationLabel}}</strong> · تعداد سوالات: <strong>{{questionCountLabel}}</strong>") +
        EmailTemplateParts.CtaButton("{{gradingLink}}", "مشاهده و تصحیح پاسخ‌ها") +
        EmailTemplateParts.Paragraph("پس از تصحیح، نتیجه برای دانشجو نمایش داده می‌شود.");
}
