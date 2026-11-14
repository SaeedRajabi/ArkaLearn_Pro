namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class PlatformTicketRepliedTemplate
{
    public const string Key = EmailTemplateKeys.PlatformTicketReplied;
    public const string DisplayName = "پاسخ تیکت پشتیبانی";
    public const string Description = "اطلاع‌رسانی به کاربر هنگام پاسخ ادمین به تیکت پشتیبانی";
    public const string Subject = "ادمین به تیکت شما ({{displayCode}}) پاسخ داد";

    public static string Body =>
        EmailTemplateParts.Greeting() +
        EmailTemplateParts.Paragraph("ادمین سیستم به تیکت شما با شماره <strong>{{displayCode}}</strong> پاسخ داده است.") +
        EmailTemplateParts.Paragraph("موضوع: {{subject}}") +
        EmailTemplateParts.Paragraph("متن پاسخ:") +
        $"""
        <blockquote style="border-right:4px solid {EmailLayout.BrandPrimary};margin:16px 0;padding:12px 16px;background:#f8fafc;font-size:15px;line-height:1.9;color:{EmailLayout.TextPrimary};text-align:right;direction:rtl;">
          {Placeholder("adminReply")}
        </blockquote>
        """ +
        EmailTemplateParts.Paragraph("برای مشاهده پاسخ و ادامه گفتگو به آدرس زیر مراجعه کنید (در صورت ورود با توکن معتبر، مستقیماً به همان تیکت هدایت می‌شوید):") +
        EmailTemplateParts.CtaButton("{{ticketLink}}", "مشاهده تیکت پشتیبانی");

    private static string Placeholder(string name) => "{{" + name + "}}";
}
