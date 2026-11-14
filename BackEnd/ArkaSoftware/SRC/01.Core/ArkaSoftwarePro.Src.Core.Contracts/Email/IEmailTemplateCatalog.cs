namespace ArkaSoftwarePro.Src.Core.Contracts.Email;

public interface IEmailTemplateCatalog
{
    IReadOnlyList<EmailTemplateDefinitionDto> GetAll();
    EmailTemplateDefinitionDto GetRequired(string templateKey);
    bool TryGet(string templateKey, out EmailTemplateDefinitionDto definition);
}

public sealed class EmailTemplateDefinitionDto
{
    public required string TemplateKey { get; init; }
    public required string DisplayName { get; init; }
    public required string Description { get; init; }
    public required string Subject { get; init; }
    public required string BodyHtml { get; init; }
}
