using ArkaSoftwarePro.Src.Core.Domain.DesktopAppReleaseAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.DesktopApp.DesktopAppRepositoryContracts.Commands;

public interface IDesktopAppCommandRepository : ICommandRepository<DesktopAppRelease, long>
{
    Task<DesktopAppRelease?> GetByIdAsync(long id, CancellationToken cancellationToken = default);

    Task<DesktopAppRelease?> GetByIdIncludingDeletedAsync(long id, CancellationToken cancellationToken = default);

    Task<bool> VersionExistsAsync(string version, CancellationToken cancellationToken = default);

    /// <summary>Hard-removes soft-deleted rows with the same Version so the unique index can be reused.</summary>
    Task PurgeSoftDeletedByVersionAsync(string version, CancellationToken cancellationToken = default);

    Task InsertReleaseAsync(DesktopAppRelease release, CancellationToken cancellationToken = default);
}
