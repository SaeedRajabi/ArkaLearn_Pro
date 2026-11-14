using ArkaSoftwarePro.Src.Core.Contracts.CacheSettings.CacheSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;
using CacheSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.CacheSettingsAggregate.Entities.CacheSettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class CacheSettingsCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<CacheSettingsEntity, ArkaSoftwareCommandDbContext>(dbContext), ICacheSettingsCommandRepository
{
    public async Task<CacheSettingsEntity?> GetCurrentAsync(CancellationToken cancellationToken = default)
        => await _dbContext.CacheSettings.OrderByDescending(x => x.Id).FirstOrDefaultAsync(cancellationToken);

    public void MarkModified(CacheSettingsEntity entity)
        => _dbContext.Entry(entity).State = EntityState.Modified;

    public async Task ForceSetIsEnabledAsync(long id, bool isEnabled, CancellationToken cancellationToken = default)
    {
        await _dbContext.CacheSettings
            .Where(x => x.Id == id)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(x => x.IsEnabled, isEnabled),
                cancellationToken);
    }
}
