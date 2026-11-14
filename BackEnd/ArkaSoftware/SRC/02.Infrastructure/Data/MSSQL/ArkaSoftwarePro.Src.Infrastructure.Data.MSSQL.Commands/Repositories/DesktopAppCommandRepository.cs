using ArkaSoftwarePro.Src.Core.Contracts.DesktopApp.DesktopAppRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.DesktopAppReleaseAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class DesktopAppCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<DesktopAppRelease, ArkaSoftwareCommandDbContext>(dbContext), IDesktopAppCommandRepository
{
    public Task<DesktopAppRelease?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
        => _dbContext.DesktopAppReleases.FirstOrDefaultAsync(x => x.Id == id && !x.IsDelete, cancellationToken);

    public Task<DesktopAppRelease?> GetByIdIncludingDeletedAsync(long id, CancellationToken cancellationToken = default)
        => _dbContext.DesktopAppReleases.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> VersionExistsAsync(string version, CancellationToken cancellationToken = default)
    {
        var normalized = version.Trim();
        return _dbContext.DesktopAppReleases.AnyAsync(
            x => !x.IsDelete && x.Version == normalized,
            cancellationToken);
    }

    public async Task PurgeSoftDeletedByVersionAsync(string version, CancellationToken cancellationToken = default)
    {
        var normalized = version.Trim();
        var softDeleted = await _dbContext.DesktopAppReleases
            .Where(x => x.IsDelete && x.Version == normalized)
            .ToListAsync(cancellationToken);
        if (softDeleted.Count == 0)
            return;

        _dbContext.DesktopAppReleases.RemoveRange(softDeleted);
    }

    public async Task InsertReleaseAsync(DesktopAppRelease release, CancellationToken cancellationToken = default)
    {
        await _dbContext.DesktopAppReleases.AddAsync(release, cancellationToken);
    }
}
