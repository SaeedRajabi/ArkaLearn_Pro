using ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.Net;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Email;

public sealed class SmtpEmailService(
    IEmailSettingsProvider settingsProvider,
    IEmailTemplateProvider templateProvider,
    IConfiguration configuration,
    ILogger<SmtpEmailService> logger) : IEmailService, IEmailTransport
{
    public Task SendRoomCredentialsAsync(
        string toEmail,
        string recipientName,
        string seminarTitle,
        string roomLink,
        string roomUserName,
        string plainPassword,
        CancellationToken cancellationToken = default)
        => SendTemplatedAsync(
            EmailTemplateKeys.RoomCredentials,
            toEmail,
            recipientName,
            new Dictionary<string, string?>
            {
                ["recipientName"] = recipientName,
                ["seminarTitle"] = seminarTitle,
                ["roomLink"] = roomLink,
                ["roomUserName"] = roomUserName,
                ["roomPassword"] = plainPassword
            },
            cancellationToken);

    public Task SendCourseAccessAsync(
        string toEmail,
        string recipientName,
        string courseTitle,
        string token,
        CancellationToken cancellationToken = default)
        => SendTemplatedAsync(
            EmailTemplateKeys.CourseOnlineAccess,
            toEmail,
            recipientName,
            new Dictionary<string, string?>
            {
                ["recipientName"] = recipientName,
                ["courseTitle"] = courseTitle,
                ["accessLink"] = token
            },
            cancellationToken);

    public async Task SendVerificationCodeAsync(
        string toEmail,
        string recipientName,
        string verificationCode,
        CancellationToken cancellationToken = default)
    {
        var runtime = await settingsProvider.GetRuntimeSettingsAsync(cancellationToken);
        await SendTemplatedAsync(
            EmailTemplateKeys.VerificationCode,
            toEmail,
            recipientName,
            new Dictionary<string, string?>
            {
                ["recipientName"] = recipientName,
                ["verificationCode"] = verificationCode,
                ["expiryMinutes"] = EmailLayout.ToPersianDigits(runtime.OtpExpiryMinutes)
            },
            cancellationToken);
    }

    public Task SendContactReplyAsync(
        string toEmail,
        string recipientName,
        string subject,
        string adminReply,
        CancellationToken cancellationToken = default)
    {
        var safeSubject = string.IsNullOrWhiteSpace(subject) ? "پاسخ تیم پشتیبانی" : subject.Trim();
        return SendTemplatedAsync(
            EmailTemplateKeys.ContactReply,
            toEmail,
            recipientName,
            new Dictionary<string, string?>
            {
                ["recipientName"] = recipientName,
                ["subject"] = safeSubject,
                ["adminReply"] = WebUtility.HtmlEncode(adminReply).Replace("\n", "<br/>", StringComparison.Ordinal)
            },
            cancellationToken,
            subjectOverride: safeSubject);
    }

    public Task SendPlatformTicketViewedAsync(
        string toEmail,
        string recipientName,
        string displayCode,
        string subject,
        string ticketLink,
        CancellationToken cancellationToken = default)
    {
        var absoluteLink = BuildClientAbsoluteLink(ticketLink);

        return SendTemplatedAsync(
            EmailTemplateKeys.PlatformTicketViewed,
            toEmail,
            recipientName,
            new Dictionary<string, string?>
            {
                ["recipientName"] = recipientName,
                ["displayCode"] = displayCode,
                ["subject"] = subject,
                ["ticketLink"] = absoluteLink,
            },
            cancellationToken);
    }

    public Task SendPlatformTicketCreatedToAdminAsync(
        string toEmail,
        string adminName,
        string requesterName,
        string displayCode,
        string subject,
        string messagePreview,
        string adminTicketLink,
        CancellationToken cancellationToken = default)
    {
        var absoluteLink = BuildAdminAbsoluteLink(adminTicketLink);

        return SendTemplatedAsync(
            EmailTemplateKeys.PlatformTicketCreatedAdmin,
            toEmail,
            adminName,
            new Dictionary<string, string?>
            {
                ["recipientName"] = adminName,
                ["requesterName"] = requesterName,
                ["displayCode"] = displayCode,
                ["subject"] = subject,
                ["messagePreview"] = WebUtility.HtmlEncode(messagePreview),
                ["adminTicketLink"] = absoluteLink,
            },
            cancellationToken);
    }

    public Task SendPlatformTicketRepliedAsync(
        string toEmail,
        string recipientName,
        string displayCode,
        string subject,
        string adminReply,
        string ticketLink,
        CancellationToken cancellationToken = default)
    {
        var absoluteLink = BuildClientAbsoluteLink(ticketLink);

        return SendTemplatedAsync(
            EmailTemplateKeys.PlatformTicketReplied,
            toEmail,
            recipientName,
            new Dictionary<string, string?>
            {
                ["recipientName"] = recipientName,
                ["displayCode"] = displayCode,
                ["subject"] = subject,
                ["adminReply"] = WebUtility.HtmlEncode(adminReply).Replace("\n", "<br/>", StringComparison.Ordinal),
                ["ticketLink"] = absoluteLink,
            },
            cancellationToken);
    }

    private string BuildClientAbsoluteLink(string relativeOrAbsoluteLink)
    {
        var clientBase = configuration["PaymentGateway:ClientBaseUrl"]?.Trim().TrimEnd('/')
            ?? "https://arkalearn.com";
        return relativeOrAbsoluteLink.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? relativeOrAbsoluteLink
            : $"{clientBase}{(relativeOrAbsoluteLink.StartsWith('/') ? relativeOrAbsoluteLink : $"/{relativeOrAbsoluteLink}")}";
    }

    private string BuildAdminAbsoluteLink(string relativeOrAbsoluteLink)
    {
        var adminBase = configuration["RoomDashboard:BaseUrl"]?.Trim().TrimEnd('/')
            ?? configuration["PaymentGateway:ClientBaseUrl"]?.Trim().TrimEnd('/')
            ?? "https://arkalearn.com";
        return relativeOrAbsoluteLink.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? relativeOrAbsoluteLink
            : $"{adminBase}{(relativeOrAbsoluteLink.StartsWith('/') ? relativeOrAbsoluteLink : $"/{relativeOrAbsoluteLink}")}";
    }

    private async Task SendTemplatedAsync(
        string templateKey,
        string toEmail,
        string? recipientName,
        IReadOnlyDictionary<string, string?> variables,
        CancellationToken cancellationToken,
        string? subjectOverride = null)
    {
        var template = await templateProvider.GetTemplateAsync(templateKey, cancellationToken);
        if (!template.IsEnabled)
        {
            logger.LogWarning("Email template {TemplateKey} is disabled; skipping send to {ToEmail}", templateKey, toEmail);
            return;
        }

        var (subject, bodyInner) = EmailTemplateRenderer.RenderTemplate(template.Subject, template.BodyHtml, variables);
        if (!string.IsNullOrWhiteSpace(subjectOverride))
            subject = subjectOverride;

        var htmlBody = EmailLayout.Wrap(subject, subject, EmailLayout.ContentBlock(bodyInner));
        await SendAsync(toEmail, recipientName, subject, htmlBody, cancellationToken, isFullDocument: true);
    }

    public async Task SendAsync(
        string toEmail,
        string? recipientName,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken,
        bool isFullDocument = false)
    {
        var options = await settingsProvider.GetSmtpOptionsAsync(cancellationToken);
        if (!options.IsConfigured)
            throw new InvalidOperationException("SMTP is not configured.");

        var message = BuildMessage(options, toEmail, recipientName, subject, htmlBody, isFullDocument);

        using var client = new SmtpClient
        {
            Timeout = options.TimeoutSeconds * 1000,
            CheckCertificateRevocation = false
        };

        if (options.AllowInvalidCertificate)
            client.ServerCertificateValidationCallback = (_, _, _, _) => true;

        try
        {
            var secureSocketOptions = ResolveSecureSocketOptions(options);
            await client.ConnectAsync(options.Host, options.Port, secureSocketOptions, cancellationToken);
            await client.AuthenticateAsync(options.Username, options.Password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            logger.LogInformation(
                "Email sent via SMTP to {ToEmail} with subject {Subject} through {Host}:{Port}",
                toEmail, subject, options.Host, options.Port);
        }
        catch (Exception ex)
        {
            var detail = SmtpConnectionDiagnostics.DescribeSmtpException(ex);
            logger.LogError(ex, "SMTP send failed to {ToEmail} via {Host}:{Port}. {Detail}", toEmail, options.Host, options.Port, detail);
            throw new InvalidOperationException(detail, ex);
        }
    }

    internal static MimeMessage BuildMessage(
        EmailSmtpOptions options,
        string toEmail,
        string? recipientName,
        string subject,
        string htmlBody,
        bool isFullDocument = false)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(options.FromName, options.FromEmail));
        message.To.Add(new MailboxAddress(recipientName ?? toEmail, toEmail));
        message.Subject = subject;

        var builder = new BodyBuilder
        {
            HtmlBody = isFullDocument ? htmlBody : WrapHtmlDocument(subject, htmlBody),
            TextBody = StripHtml(htmlBody)
        };
        message.Body = builder.ToMessageBody();
        return message;
    }

    private static SecureSocketOptions ResolveSecureSocketOptions(EmailSmtpOptions options)
    {
        if (options.UseSsl)
            return SecureSocketOptions.SslOnConnect;
        if (options.UseStartTls)
            return SecureSocketOptions.StartTls;
        return SecureSocketOptions.Auto;
    }

    private static string WrapHtmlDocument(string subject, string innerHtml) =>
        EmailLayout.Wrap(subject, subject, EmailLayout.ContentBlock(innerHtml));

    private static string StripHtml(string html)
    {
        var text = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ");
        return WebUtility.HtmlDecode(text).Replace("  ", " ", StringComparison.Ordinal).Trim();
    }
}
