namespace ArkaSoftwarePro.Src.Core.Contracts.Email;

public interface IEmailTransport
{
    Task SendAsync(string toEmail, string? recipientName, string subject, string htmlBody,
        CancellationToken cancellationToken, bool isFullDocument = false);
}
