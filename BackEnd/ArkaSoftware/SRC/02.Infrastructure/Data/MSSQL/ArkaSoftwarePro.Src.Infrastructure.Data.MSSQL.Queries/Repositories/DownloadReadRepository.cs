using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.RequestResponse.FileStorage;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public sealed class DownloadReadRepository(ArkaSoftwareQueryDbContext queryDb) : IDownloadReadRepository
{
    public Task<CurriculumMaterialDownload?> GetCurriculumMaterialAsync(long materialId, CancellationToken cancellationToken) =>
        queryDb.CourseCurriculumMaterials.AsNoTracking().Where(material => material.Id == materialId && !material.IsDelete)
        .Select(material => new CurriculumMaterialDownload(material.CourseId, material.MediaAssetId, material.DisplayName))
        .FirstOrDefaultAsync(cancellationToken);

    public Task<MediaAssetDownload?> GetMediaAssetAsync(long assetId, CancellationToken cancellationToken) =>
        queryDb.MediaAssets.AsNoTracking().Where(asset => asset.Id == assetId && !asset.IsDelete)
        .Select(asset => new MediaAssetDownload(asset.FileUrl, asset.OriginalFileName, asset.MimeType, asset.IsEncrypted))
        .FirstOrDefaultAsync(cancellationToken);

    public async Task<PublishedInstaller?> GetPublishedInstallerAsync(string? version, CancellationToken cancellationToken)
    {
        var releaseQuery = queryDb.DesktopAppReleases.AsNoTracking()
            .Where(x => !x.IsDelete && x.IsPublished);

        if (!string.IsNullOrWhiteSpace(version))
        {
            var requested = version.Trim().TrimStart('v', 'V');
            releaseQuery = releaseQuery.Where(x => x.Version == requested || x.Version == version.Trim());
        }

        return await releaseQuery
            .OrderByDescending(x => x.PublishedAtUtc)
            .Select(x => new PublishedInstaller(x.Version, x.InstallerUrl))
            .FirstOrDefaultAsync(cancellationToken);

    }

    public Task<string?> GetOriginalMediaFileNameAsync(string relativePath, CancellationToken cancellationToken) =>
        queryDb.MediaAssets.AsNoTracking()
        .Where(asset => !asset.IsDelete && (asset.FileUrl == relativePath || asset.FileUrl.EndsWith(relativePath)))
        .Select(asset => asset.OriginalFileName).FirstOrDefaultAsync(cancellationToken);
}
