using ArkaSoftwarePro.Src.Core.Contracts.Services;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Email;

/// <summary>
/// Logs emails when SMTP is disabled. Throws if SMTP is enabled but misconfigured so sends are not silently dropped.
/// </summary>
public class NoOpEmailService(
    IOptions<ArkaSoftwarePro.Src.Core.Contracts.Email.SmtpEmailOptions> smtpOptions,
    ILogger<NoOpEmailService>? logger = null) : IEmailService
{
    private readonly ArkaSoftwarePro.Src.Core.Contracts.Email.SmtpEmailOptions _smtp = smtpOptions.Value;
    private readonly ILogger<NoOpEmailService> _logger = logger ?? Microsoft.Extensions.Logging.Abstractions.NullLogger<NoOpEmailService>.Instance;

    private Task GuardAsync()
    {
        if (_smtp.Enabled)
        {
            throw new InvalidOperationException(
                "SMTP is enabled in configuration but the email service is not fully configured. " +
                "Set Smtp:Host (e.g. mail.arkasoftware.ir for Plesk), Port, Username, Password, and FromEmail, then restart the API.");
        }

        _logger.LogWarning("[Email] NoOp: SMTP disabled — email was not sent.");
        return Task.CompletedTask;
    }

    public async Task SendRoomCredentialsAsync(string toEmail, string recipientName, string seminarTitle, string roomLink, string roomUserName, string plainPassword, CancellationToken cancellationToken = default)
    {
        await GuardAsync();
        _logger.LogInformation("[Email] Room credentials (NoOp): To={ToEmail}, Seminar={SeminarTitle}", toEmail, seminarTitle);
    }

    public async Task SendCourseAccessAsync(string toEmail, string recipientName, string courseTitle, string token, CancellationToken cancellationToken = default)
    {
        await GuardAsync();
        _logger.LogInformation("[Email] Course access (NoOp): To={ToEmail}, Course={CourseTitle}", toEmail, courseTitle);
    }

    public async Task SendVerificationCodeAsync(string toEmail, string recipientName, string verificationCode, CancellationToken cancellationToken = default)
    {
        await GuardAsync();
        _logger.LogInformation("[Email] Verification code (NoOp): To={ToEmail}, Code={Code}", toEmail, verificationCode);
    }

    public async Task SendContactReplyAsync(string toEmail, string recipientName, string subject, string adminReply, CancellationToken cancellationToken = default)
    {
        await GuardAsync();
        _logger.LogInformation("[Email] Contact reply (NoOp): To={ToEmail}, Subject={Subject}", toEmail, subject);
    }

    public async Task SendPlatformTicketViewedAsync(string toEmail, string recipientName, string displayCode, string subject, string ticketLink, CancellationToken cancellationToken = default)
    {
        await GuardAsync();
        _logger.LogInformation("[Email] Platform ticket viewed (NoOp): To={ToEmail}, Code={Code}", toEmail, displayCode);
    }

    public async Task SendPlatformTicketCreatedToAdminAsync(string toEmail, string adminName, string requesterName, string displayCode, string subject, string messagePreview, string adminTicketLink, CancellationToken cancellationToken = default)
    {
        await GuardAsync();
        _logger.LogInformation("[Email] Platform ticket created admin (NoOp): To={ToEmail}, Code={Code}, From={Requester}", toEmail, displayCode, requesterName);
    }

    public async Task SendPlatformTicketRepliedAsync(string toEmail, string recipientName, string displayCode, string subject, string adminReply, string ticketLink, CancellationToken cancellationToken = default)
    {
        await GuardAsync();
        _logger.LogInformation("[Email] Platform ticket replied (NoOp): To={ToEmail}, Code={Code}", toEmail, displayCode);
    }
}
