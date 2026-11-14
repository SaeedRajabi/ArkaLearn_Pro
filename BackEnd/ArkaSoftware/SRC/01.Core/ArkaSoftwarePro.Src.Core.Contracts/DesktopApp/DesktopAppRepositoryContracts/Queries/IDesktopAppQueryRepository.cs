using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Queries.CheckDesktopAppUpdate;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Queries.GetDesktopAppReleases;
using Framework.Src.Core.Contracts.Data.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.DesktopApp.DesktopAppRepositoryContracts.Queries;

public interface IDesktopAppQueryRepository : IQueryRepository
{
    Task<DesktopAppUpdateQri> CheckUpdateAsync(string? currentVersion, CancellationToken cancellationToken = default);

    Task<List<DesktopAppReleaseAdminQri>> ListReleasesAsync(CancellationToken cancellationToken = default);
}
