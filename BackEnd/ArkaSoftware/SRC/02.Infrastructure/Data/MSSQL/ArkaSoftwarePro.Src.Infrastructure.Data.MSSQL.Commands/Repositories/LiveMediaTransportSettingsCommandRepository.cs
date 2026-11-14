using ArkaSoftwarePro.Src.Core.Contracts.LiveMediaTransportSettings.LiveMediaTransportSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;
using LiveMediaTransportSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.LiveMediaTransportSettingsAggregate.Entities.LiveMediaTransportSettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class LiveMediaTransportSettingsCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<LiveMediaTransportSettingsEntity, ArkaSoftwareCommandDbContext>(dbContext),
      ILiveMediaTransportSettingsCommandRepository
{
    public async Task<LiveMediaTransportSettingsEntity?> GetCurrentAsync(
        CancellationToken cancellationToken = default)
        => await dbContext.LiveMediaTransportSettings
            .OrderByDescending(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);
}
