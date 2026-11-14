using ArkaSoftwarePro.Src.Core.Contracts.EmailTemplates.EmailTemplateRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class EmailTemplateQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IEmailTemplateQueryRepository
{
    public async Task<IReadOnlyList<EmailTemplateRepoListItem>> ListFromDatabaseAsync()
        => await dbContext.EmailTemplates.AsNoTracking()
            .Select(x => new EmailTemplateRepoListItem
            {
                TemplateKey = x.TemplateKey,
                DisplayName = x.DisplayName,
                Description = x.Description,
                IsEnabled = x.IsEnabled,
                IsCustomized = true
            })
            .ToListAsync();

    public async Task<EmailTemplateRepoDetail?> GetByKeyFromDatabaseAsync(string templateKey)
    {
        var row = await dbContext.EmailTemplates.AsNoTracking()
            .FirstOrDefaultAsync(x => x.TemplateKey == templateKey);
        if (row is null)
            return null;

        return new EmailTemplateRepoDetail
        {
            TemplateKey = row.TemplateKey,
            DisplayName = row.DisplayName,
            Description = row.Description,
            Subject = row.Subject,
            BodyHtml = row.BodyHtml,
            IsEnabled = row.IsEnabled,
            IsCustomized = true
        };
    }
}
