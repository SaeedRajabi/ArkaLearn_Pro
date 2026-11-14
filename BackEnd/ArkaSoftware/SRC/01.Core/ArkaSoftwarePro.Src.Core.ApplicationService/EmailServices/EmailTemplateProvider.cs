using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.EmailTemplates.EmailTemplateRepositoryContracts.Commands;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;

public sealed class EmailTemplateProvider(
    IEmailTemplateCommandRepository repository,
    IEmailTemplateCatalog catalog) : IEmailTemplateProvider
{
    public async Task<EmailTemplateContent> GetTemplateAsync(string templateKey, CancellationToken cancellationToken = default)
    {
        var key = templateKey?.Trim() ?? string.Empty;
        if (string.IsNullOrEmpty(key))
            throw new ArgumentException("Template key is required.", nameof(templateKey));

        var db = await repository.GetByKeyAsync(key);
        if (db is not null)
        {
            return new EmailTemplateContent
            {
                TemplateKey = db.TemplateKey,
                DisplayName = db.DisplayName,
                Description = db.Description,
                Subject = db.Subject,
                BodyHtml = db.BodyHtml,
                IsEnabled = db.IsEnabled,
                IsCustomized = true
            };
        }

        return EmailTemplateCatalog.ToContent(catalog.GetRequired(key));
    }
}
