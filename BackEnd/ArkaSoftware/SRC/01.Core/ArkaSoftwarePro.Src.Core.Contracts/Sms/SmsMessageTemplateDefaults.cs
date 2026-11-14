namespace ArkaSoftwarePro.Src.Core.Contracts.Sms;

public static class SmsMessageTemplateDefaults
{
    public const int SupportChatUnreadSmsDelayMinutes = 20;

    public const string SupportChatTeacherUnreadMessage =
        "دانشجوی #FULLNAME# یک سوال با عنوان #TITLE# در پشتیبانی طرح کرده و منتظر پاسخ است. ❓ تیم توسعه آرکا نرم افزار";

    public const string SupportChatStudentUnreadMessage =
        "استاد #FULLNAME# به سوال #TITLE# پاسخ داده است. 🧑‍🏫 لطفا بخش پشتیبانی آنلاین رو بررسی کنید. 💻 تیم توسعه آرکا نرم افزار.";

    public const string EducationPlanInstallmentDueMessage =
        "دانشجوی گرامی #FULLNAME#، تاریخ پرداخت قسط #INSTALLMENT# پلن «#TITLE#» به مبلغ #AMOUNT# تومان در تاریخ #DUEDATE# است (#DAYSTEXT#). لطفاً برای پرداخت اقدام کنید. تیم آرکا نرم‌افزار";

    public const string StudentSharedFileMessage =
        "فایل جلسه با عنوان #TITLE# برای شما بارگذاری شد. 📥\n" +
        "برای دانلود، به بخش \"داشبورد\" و سپس \"فایل‌های اشتراکی\" مراجعه نمایید.\n" +
        " تیم پشتیبانی آرکا نرم‌افزار";

    public const string TeacherSharedFileDownloadedMessage =
        "دانشجو #FULLNAME# فایل «#TITLE#» را دانلود کرد.";

    public const string CalendarEventReminderMessage =
        "یادآور آرکا نرم افزار: رویداد شما با عنوان #TITLE# در تاریخ #DATE#، ساعت #TIME# برگزار خواهد شد. تیم پشتیبانی آرکا نرم‌افزار";

    public static string ApplyTitleDateTime(string template, string title, string date, string time) =>
        ApplyTitle(
            (string.IsNullOrWhiteSpace(template) ? string.Empty : template)
                .Replace("#DATE#", date, StringComparison.OrdinalIgnoreCase)
                .Replace("{Date}", date, StringComparison.OrdinalIgnoreCase)
                .Replace("#TIME#", time, StringComparison.OrdinalIgnoreCase)
                .Replace("{Time}", time, StringComparison.OrdinalIgnoreCase),
            title);

    public static string ApplyFullNameTitle(string template, string fullName, string title) =>
        ApplyTitle(
            (string.IsNullOrWhiteSpace(template) ? string.Empty : template)
                .Replace("#FULLNAME#", fullName, StringComparison.OrdinalIgnoreCase)
                .Replace("{StudentName}", fullName, StringComparison.OrdinalIgnoreCase),
            title);

    public static string ApplyTitle(string template, string title) =>
        (string.IsNullOrWhiteSpace(template) ? string.Empty : template)
            .Replace("#TITLE#", title, StringComparison.OrdinalIgnoreCase)
            .Replace("{Subject}", title, StringComparison.OrdinalIgnoreCase)
            .Replace("{PlanTitle}", title, StringComparison.OrdinalIgnoreCase);
}
