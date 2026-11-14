namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Templates;

internal static class PasswordResetTemplate
{
    public const string Key = EmailTemplateKeys.PasswordReset;
    public const string DisplayName = "بازیابی رمز عبور";
    public const string Description = "لینک بازیابی رمز عبور";
    public const string Subject = "بازیابی رمز عبور — آرکا نرم افزار";

    public static string Body =>
        EmailTemplateParts.Greeting("{{recipientName}}") +
        EmailTemplateParts.Paragraph("درخواست بازیابی رمز عبور برای حساب شما ثبت شد. برای تنظیم رمز جدید روی دکمه زیر کلیک کنید:") +
        EmailTemplateParts.CtaButton("{{resetLink}}", "تنظیم رمز عبور جدید") +
        EmailTemplateParts.InfoBox("این لینک تا <strong>{{expiryMinutes}}</strong> دقیقه معتبر است.") +
        EmailTemplateParts.Paragraph("اگر این درخواست را شما ارسال نکرده‌اید، این ایمیل را نادیده بگیرید.");
}
