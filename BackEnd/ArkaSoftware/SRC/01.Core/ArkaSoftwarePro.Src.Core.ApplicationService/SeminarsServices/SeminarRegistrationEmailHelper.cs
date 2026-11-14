using ArkaSoftwarePro.Src.Core.Contracts.Email;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices;

internal static class SeminarRegistrationEmailHelper
{
    public static async Task TrySendRegistrationEmailsAsync(
        ITransactionalEmailNotifier notifier,
        string? email,
        string recipientName,
        string seminarTitle,
        decimal priceToman,
        bool isFree,
        bool hasPaid,
        string roomLink,
        string roomUserName,
        string roomPassword,
        string? paymentReference = null)
    {
        if (string.IsNullOrWhiteSpace(email))
            return;

        try
        {
            var amountLabel = isFree || !hasPaid
                ? "رایگان"
                : $"{priceToman:N0} تومان";

            await notifier.SendSeminarRegistrationAsync(
                email,
                recipientName,
                seminarTitle,
                amountLabel,
                paymentReference);

            if (!string.IsNullOrWhiteSpace(roomLink))
            {
                await notifier.SendSeminarOnlineAccessAsync(
                    email,
                    recipientName,
                    seminarTitle,
                    roomLink,
                    roomUserName,
                    roomPassword);
            }
        }
        catch
        {
            // Registration should succeed even if email delivery fails.
        }
    }
}
