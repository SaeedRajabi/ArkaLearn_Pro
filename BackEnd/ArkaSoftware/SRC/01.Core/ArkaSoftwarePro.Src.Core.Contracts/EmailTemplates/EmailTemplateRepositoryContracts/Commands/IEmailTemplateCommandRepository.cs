using ArkaSoftwarePro.Src.Core.Domain.EmailTemplateAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.EmailTemplates.EmailTemplateRepositoryContracts.Commands;

public interface IEmailTemplateCommandRepository : ICommandRepository<EmailTemplate, long>
{
    Task<EmailTemplate?> GetByKeyAsync(string templateKey);
}
