using ArkaSoftwarePro.Src.Core.RequestResponse.FileStorage;

namespace ArkaSoftwarePro.Src.Core.Contracts.FileStorage;

public interface IDownloadReadRepository
{
    Task<CurriculumMaterialDownload?> GetCurriculumMaterialAsync(long materialId, CancellationToken cancellationToken);
    Task<MediaAssetDownload?> GetMediaAssetAsync(long assetId, CancellationToken cancellationToken);
    Task<PublishedInstaller?> GetPublishedInstallerAsync(string? version, CancellationToken cancellationToken);
    Task<string?> GetOriginalMediaFileNameAsync(string relativePath, CancellationToken cancellationToken);
}
