namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class ContactReplyTemplate
{
    public const string Key = EmailTemplateKeys.ContactReply;
    public const string DisplayName = "پاسخ تماس با ما";
    public const string Description = "پاسخ تیم پشتیبانی به درخواست تماس";
    public const string Subject = "{{subject}}";

    public static string Body =>
        EmailTemplateParts.Greeting() +
        EmailTemplateParts.Paragraph("پاسخ تیم پشتیبانی آرکا نرم افزار:") +
        $"""
        <blockquote style="border-right:4px solid {EmailLayout.BrandPrimary};margin:16px 0;padding:12px 16px;background:#f8fafc;font-size:15px;line-height:1.9;color:{EmailLayout.TextPrimary};text-align:right;direction:rtl;">
          {Placeholder("adminReply")}
        </blockquote>
        """;

    private static string Placeholder(string name) => "{{" + name + "}}";
}
