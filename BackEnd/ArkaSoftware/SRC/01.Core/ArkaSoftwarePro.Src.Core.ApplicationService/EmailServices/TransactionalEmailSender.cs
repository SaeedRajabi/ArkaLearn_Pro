using ArkaSoftwarePro.Src.Core.Contracts.Email;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;

public sealed class TransactionalEmailSender(
    IEmailTemplateProvider templateProvider,
    IEmailTransport smtpEmailService,
    ILogger<TransactionalEmailSender> logger)
{
    public async Task SendAsync(
        string templateKey,
        string toEmail,
        string? recipientName,
        IReadOnlyDictionary<string, string?> variables,
        CancellationToken cancellationToken = default)
    {
        var template = await templateProvider.GetTemplateAsync(templateKey, cancellationToken);
        if (!template.IsEnabled)
        {
            logger.LogWarning("Email template {TemplateKey} is disabled; skipping send to {ToEmail}", templateKey, toEmail);
            return;
        }

        var (subject, bodyInner) = EmailTemplateRenderer.RenderTemplate(template.Subject, template.BodyHtml, variables);
        var isFullDocument = bodyInner.TrimStart().StartsWith("<!DOCTYPE", StringComparison.OrdinalIgnoreCase);
        var htmlBody = isFullDocument
            ? bodyInner
            : EmailLayout.Wrap(subject, subject, EmailLayout.ContentBlock(bodyInner));

        await smtpEmailService.SendAsync(
            toEmail,
            recipientName,
            subject,
            htmlBody,
            cancellationToken,
            isFullDocument: true);
    }
}
