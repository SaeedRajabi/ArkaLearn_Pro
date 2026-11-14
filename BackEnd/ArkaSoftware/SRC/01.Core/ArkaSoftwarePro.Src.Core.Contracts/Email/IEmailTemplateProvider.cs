namespace ArkaSoftwarePro.Src.Core.Contracts.Email;

public interface IEmailTemplateProvider
{
    Task<EmailTemplateContent> GetTemplateAsync(string templateKey, CancellationToken cancellationToken = default);
}

public sealed class EmailTemplateContent
{
    public string TemplateKey { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Subject { get; init; } = string.Empty;
    public string BodyHtml { get; init; } = string.Empty;
    public bool IsEnabled { get; init; } = true;
    public bool IsCustomized { get; init; }
}
