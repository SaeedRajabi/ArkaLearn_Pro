using ArkaSoftwarePro.Src.Core.Contracts.GoogleAuthSettings.GoogleAuthSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;
using GoogleAuthSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.GoogleAuthSettingsAggregate.Entities.GoogleAuthSettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class GoogleAuthSettingsCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<GoogleAuthSettingsEntity, ArkaSoftwareCommandDbContext>(dbContext), IGoogleAuthSettingsCommandRepository
{
    public async Task<GoogleAuthSettingsEntity?> GetCurrentAsync()
        => await _dbContext.GoogleAuthSettings.OrderByDescending(x => x.Id).FirstOrDefaultAsync();
}
