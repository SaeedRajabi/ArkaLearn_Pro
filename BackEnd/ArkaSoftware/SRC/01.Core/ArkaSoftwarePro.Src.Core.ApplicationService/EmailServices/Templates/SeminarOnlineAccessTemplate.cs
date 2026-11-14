namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class SeminarOnlineAccessTemplate
{
    public const string Key = EmailTemplateKeys.SeminarOnlineAccess;
    public const string DisplayName = "دسترسی آنلاین سمینار";
    public const string Description = "اطلاعات ورود به اتاق سمینار";
    public const string Subject = "دسترسی آنلاین سمینار: {{seminarTitle}}";

    public static string Body =>
        EmailTemplateParts.Greeting() +
        EmailTemplateParts.Paragraph("اطلاعات ورود به سمینار <strong>{{seminarTitle}}</strong>:") +
        RoomAccessListHtml() +
        EmailTemplateParts.CtaButton();

    private static string RoomAccessListHtml() =>
        """
        <ul style="margin:0 0 16px;padding-right:20px;font-size:15px;line-height:1.9;color:PLACEHOLDER_MUTED;text-align:right;direction:rtl;">
          <li>لینک اتاق: <a href="{{roomLink}}" style="color:PLACEHOLDER_PRIMARY;">{{roomLink}}</a></li>
          <li>نام کاربری: <code style="background:PLACEHOLDER_SURFACE;padding:2px 6px;border-radius:4px;">{{roomUserName}}</code></li>
          <li>رمز عبور: <code style="background:PLACEHOLDER_SURFACE;padding:2px 6px;border-radius:4px;">{{roomPassword}}</code></li>
        </ul>
        """
            .Replace("PLACEHOLDER_MUTED", EmailLayout.TextMuted, StringComparison.Ordinal)
            .Replace("PLACEHOLDER_PRIMARY", EmailLayout.BrandPrimary, StringComparison.Ordinal)
            .Replace("PLACEHOLDER_SURFACE", EmailLayout.SurfaceMuted, StringComparison.Ordinal);
}
