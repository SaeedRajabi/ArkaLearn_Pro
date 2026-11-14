namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class VerificationCodeTemplate
{
    public const string Key = EmailTemplateKeys.VerificationCode;
    public const string DisplayName = "کد تأیید ایمیل";
    public const string Description = "ارسال کد OTP برای تأیید ایمیل";
    public const string Subject = "کد تأیید ایمیل — آرکا نرم افزار";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph("برای تأیید ایمیل خود، کد زیر را در فرم مربوطه وارد کنید:") +
        EmailTemplateParts.CodeBox("کد تأیید", "{{verificationCode}}") +
        EmailTemplateParts.InfoBox("این کد تا <strong>{{expiryMinutes}}</strong> دقیقه معتبر است.") +
        EmailTemplateParts.Paragraph("اگر این درخواست را شما ارسال نکرده‌اید، این ایمیل را نادیده بگیرید.");
}
