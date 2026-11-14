namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;

internal static class EmailHtmlTemplates
{
    public static string VerificationCode(string recipientName, string verificationCode, int expiryMinutes = 10)
    {
        var content =
            EmailTemplateParts.Greeting("{{recipientName}}") +
            EmailTemplateParts.Paragraph("برای تأیید ایمیل خود، کد زیر را در فرم مربوطه وارد کنید:") +
            EmailTemplateParts.CodeBox("کد تأیید", "{{verificationCode}}") +
            EmailTemplateParts.InfoBox("این کد تا <strong>{{expiryMinutes}}</strong> دقیقه معتبر است.") +
            EmailTemplateParts.Paragraph("اگر این درخواست را شما ارسال نکرده‌اید، این ایمیل را نادیده بگیرید.");

        content = EmailTemplateRenderer.Render(content, new Dictionary<string, string?>
        {
            ["recipientName"] = recipientName,
            ["verificationCode"] = verificationCode,
            ["expiryMinutes"] = EmailLayout.ToPersianDigits(expiryMinutes)
        });

        return EmailLayout.Wrap("کد تأیید ایمیل", "کد تأیید ایمیل", content);
    }

    public static string WrapLayout(string pageTitle, string headerTitle, string contentHtml)
        => EmailLayout.Wrap(pageTitle, headerTitle, contentHtml);

    public static string ContentBlock(string innerHtml) => EmailLayout.ContentBlock(innerHtml);
}
