using ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection.DatabaseConnectionSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;
using DatabaseConnectionSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.DatabaseConnectionSettingsAggregate.Entities.DatabaseConnectionSettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class DatabaseConnectionSettingsCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<DatabaseConnectionSettingsEntity, ArkaSoftwareCommandDbContext>(dbContext),
        IDatabaseConnectionSettingsCommandRepository
{
    public async Task<DatabaseConnectionSettingsEntity?> GetCurrentAsync(CancellationToken cancellationToken = default)
        => await _dbContext.DatabaseConnectionSettings.OrderByDescending(x => x.Id).FirstOrDefaultAsync(cancellationToken);
}
