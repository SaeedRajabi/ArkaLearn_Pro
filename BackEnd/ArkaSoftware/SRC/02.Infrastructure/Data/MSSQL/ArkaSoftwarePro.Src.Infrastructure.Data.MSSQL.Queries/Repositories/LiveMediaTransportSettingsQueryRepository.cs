using ArkaSoftwarePro.Src.Core.Contracts.LiveMediaTransportSettings.LiveMediaTransportSettingsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class LiveMediaTransportSettingsQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext),
      ILiveMediaTransportSettingsQueryRepository
{
    public async Task<LiveMediaTransportSettingsQri?> GetCurrentAsync(
        CancellationToken cancellationToken = default)
    {
        var row = await dbContext.LiveMediaTransportSettings
            .AsNoTracking()
            .OrderByDescending(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (row is null) return null;
        return new LiveMediaTransportSettingsQri
        {
            TransportMode = row.TransportMode,
            LiveKitUrl = row.LiveKitUrl,
            LiveKitApiKey = row.LiveKitApiKey,
            LiveKitApiSecretEncrypted = row.LiveKitApiSecretEncrypted,
            TurnUrl = row.TurnUrl,
            TurnUsername = row.TurnUsername,
            TurnPasswordEncrypted = row.TurnPasswordEncrypted,
            StunUrls = row.StunUrls,
        };
    }
}
