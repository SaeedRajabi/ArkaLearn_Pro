namespace ArkaSoftwarePro.Src.Core.Contracts.EmailTemplates.EmailTemplateRepositoryContracts.Queries;

public interface IEmailTemplateQueryRepository
{
    Task<IReadOnlyList<EmailTemplateRepoListItem>> ListFromDatabaseAsync();
    Task<EmailTemplateRepoDetail?> GetByKeyFromDatabaseAsync(string templateKey);
}

public sealed class EmailTemplateRepoListItem
{
    public string TemplateKey { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public bool IsCustomized { get; set; }
}

public sealed class EmailTemplateRepoDetail
{
    public string TemplateKey { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string BodyHtml { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public bool IsCustomized { get; set; }
}
