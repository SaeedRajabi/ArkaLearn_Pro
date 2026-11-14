namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class EducationPlanAssignedTemplate
{
    public const string Key = EmailTemplateKeys.EducationPlanAssigned;
    public const string DisplayName = "تخصیص پلن آموزشی خصوصی";
    public const string Description = "ایمیل به دانشجو هنگام تعریف یا ویرایش پلن آموزشی خصوصی";
    public const string Subject = "پلن آموزشی «{{planTitle}}» برای شما ثبت شد";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph(
            "پلن آموزشی خصوصی «{{planTitle}}» توسط استاد {{teacherName}} برای شما تعریف/به‌روزرسانی شد.") +
        EmailTemplateParts.Paragraph(
            "مدت: {{totalHours}} ساعت · مبلغ پایه: <strong>{{totalCostLabel}}</strong> · نوع پرداخت: {{paymentTypeLabel}}") +
        EmailTemplateParts.Paragraph("{{installmentsHtml}}") +
        EmailTemplateParts.CtaButton("{{plansLink}}", "مشاهده پلن‌های من") +
        EmailTemplateParts.Paragraph("در صورت نیاز با استاد یا پشتیبانی آرکا نرم‌افزار در ارتباط باشید.");
}
