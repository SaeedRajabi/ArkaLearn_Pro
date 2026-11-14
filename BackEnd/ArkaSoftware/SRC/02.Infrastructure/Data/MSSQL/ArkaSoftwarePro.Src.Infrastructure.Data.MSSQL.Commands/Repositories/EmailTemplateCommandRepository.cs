using ArkaSoftwarePro.Src.Core.Contracts.EmailTemplates.EmailTemplateRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.EmailTemplateAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class EmailTemplateCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<EmailTemplate, ArkaSoftwareCommandDbContext>(dbContext), IEmailTemplateCommandRepository
{
    public async Task<EmailTemplate?> GetByKeyAsync(string templateKey)
        => await _dbContext.EmailTemplates
            .FirstOrDefaultAsync(x => x.TemplateKey == templateKey);
}
