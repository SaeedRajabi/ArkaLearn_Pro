namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class NewsletterNewContentTemplate
{
    public const string Key = EmailTemplateKeys.NewsletterNewContent;
    public const string DisplayName = "خبرنامه — محتوای جدید";
    public const string Description = "اطلاع‌رسانی انتشار مقاله، کتاب، دوره یا سمینار به اعضای خبرنامه";
    public const string Subject = "{{contentTypeLabel}} جدید: {{contentTitle}}";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph(
            "یک {{contentTypeLabel}} جدید در آرکا نرم افزار منتشر شده است:") +
        EmailTemplateParts.Paragraph("<strong>{{contentTitle}}</strong>") +
        EmailTemplateParts.Paragraph("منتشرکننده: {{authorName}}") +
        EmailTemplateParts.CtaButton("{{contentLink}}", "مشاهده") +
        EmailTemplateParts.Paragraph("اگر دیگر مایل به دریافت این ایمیل‌ها نیستید، می‌توانید عضویت خبرنامه را لغو کنید.");
}
