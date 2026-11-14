using ArkaSoftwarePro.Src.Core.Contracts.EmailSettings.EmailSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;
using EmailSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.EmailSettingsAggregate.Entities.EmailSettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class EmailSettingsCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<EmailSettingsEntity, ArkaSoftwareCommandDbContext>(dbContext), IEmailSettingsCommandRepository
{
    public async Task<EmailSettingsEntity?> GetCurrentAsync()
        => await _dbContext.EmailSettings.OrderByDescending(x => x.Id).FirstOrDefaultAsync();
}
