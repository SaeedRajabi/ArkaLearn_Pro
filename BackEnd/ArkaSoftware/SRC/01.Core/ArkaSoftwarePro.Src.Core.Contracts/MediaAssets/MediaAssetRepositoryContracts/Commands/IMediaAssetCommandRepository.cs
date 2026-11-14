using ArkaSoftwarePro.Src.Core.Domain.MediaAssetAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.MediaAssets.MediaAssetRepositoryContracts.Commands;

public interface IMediaAssetCommandRepository : ICommandRepository<MediaAsset, long>
{
    Task<MediaAsset?> GetActiveByIdAsync(long id);
    Task<MediaAsset?> FindActiveByFileUrlAsync(string fileUrlOrPath, CancellationToken cancellationToken = default);
    Task<List<MediaAsset>> SearchAsync(
        long? ownerUserId,
        int? mediaType,
        string? search,
        bool includeAllOwners,
        int skip,
        int take);
    Task<int> CountAsync(long? ownerUserId, int? mediaType, string? search, bool includeAllOwners);
}
