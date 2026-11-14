namespace ArkaSoftwarePro.Src.Core.Contracts.Services
{
    /// <summary>
    /// ارسال ایمیل (اعتبارسنجی اتاق، رمز ورود به اتاق و ...)
    /// </summary>
    public interface IEmailService
    {
        Task SendRoomCredentialsAsync(string toEmail, string recipientName, string seminarTitle, string roomLink, string roomUserName, string plainPassword, CancellationToken cancellationToken = default);

        Task SendCourseAccessAsync(string toEmail, string recipientName, string courseTitle, string token, CancellationToken cancellationToken = default);

        Task SendVerificationCodeAsync(string toEmail, string recipientName, string verificationCode, CancellationToken cancellationToken = default);

        Task SendContactReplyAsync(string toEmail, string recipientName, string subject, string adminReply, CancellationToken cancellationToken = default);

        Task SendPlatformTicketViewedAsync(string toEmail, string recipientName, string displayCode, string subject, string ticketLink, CancellationToken cancellationToken = default);

        Task SendPlatformTicketCreatedToAdminAsync(string toEmail, string adminName, string requesterName, string displayCode, string subject, string messagePreview, string adminTicketLink, CancellationToken cancellationToken = default);

        Task SendPlatformTicketRepliedAsync(string toEmail, string recipientName, string displayCode, string subject, string adminReply, string ticketLink, CancellationToken cancellationToken = default);
    }
}
