namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;

internal static class TransactionalEmailFormatting
{
    public static string FormatAmountLabel(decimal amountToman)
        => amountToman <= 0 ? "رایگان" : $"{amountToman:N0} تومان";

    public static string FormatPersianDate(DateTime utcDate)
        => utcDate.ToLocalTime().ToString("yyyy/MM/dd HH:mm");
}
