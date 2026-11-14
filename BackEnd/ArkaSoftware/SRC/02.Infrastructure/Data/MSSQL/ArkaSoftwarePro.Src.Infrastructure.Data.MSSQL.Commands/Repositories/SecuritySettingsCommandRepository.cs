using ArkaSoftwarePro.Src.Core.Contracts.SecuritySettings.SecuritySettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;
using SecuritySettingsEntity = ArkaSoftwarePro.Src.Core.Domain.SecuritySettingsAggregate.Entities.SecuritySettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class SecuritySettingsCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<SecuritySettingsEntity, ArkaSoftwareCommandDbContext>(dbContext), ISecuritySettingsCommandRepository
{
    public async Task<SecuritySettingsEntity?> GetCurrentAsync()
        => await _dbContext.SecuritySettings.OrderByDescending(x => x.Id).FirstOrDefaultAsync();
}
