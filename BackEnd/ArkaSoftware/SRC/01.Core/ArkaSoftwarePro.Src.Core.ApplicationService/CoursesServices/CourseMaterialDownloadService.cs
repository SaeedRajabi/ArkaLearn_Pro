using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.Contracts.Users.Services;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.RequestResponse.Common;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;

public sealed class CourseMaterialDownloadService(ICourseQueriesRepository courseQueries,
    IDownloadReadRepository downloads, IFileStorage fileStorage, ILegacyFileStore legacyFiles, ICurrentActor actor)
{
    public async Task<FileOperationResult> Download(long materialId, CancellationToken cancellationToken)
    {
        if (materialId <= 0)
            return FileOperationResult.Invalid(new { message = "materialId is required." });

        if (!TryGetUserId(out var userId))
            return FileOperationResult.Unauthenticated();

        var material = await downloads.GetCurriculumMaterialAsync(materialId, cancellationToken);
        if (material is null)
            return FileOperationResult.Missing();

        var isStaff = actor.Principal.IsDashboardAdminRole();
        if (!isStaff)
        {
            if (!await courseQueries.HasActiveEnrollmentAsync(userId, material.CourseId))
                return FileOperationResult.Denied(new { message = "Enrollment required." });

            var delivery = await courseQueries.GetCourseDeliveryModeAsync(material.CourseId);
            if (!CourseLifecycleRules.AllowsWebLessonVideoPlayback(delivery))
                return FileOperationResult.Denied(new { message = "This material is only available in the Windows desktop app." });
        }

        var asset = await downloads.GetMediaAssetAsync(material.MediaAssetId, cancellationToken);
        if (asset is null || string.IsNullOrWhiteSpace(asset.FileUrl) || asset.IsEncrypted)
            return FileOperationResult.Missing();

        var downloadName = string.IsNullOrWhiteSpace(material.DisplayName)
            ? (asset.OriginalFileName ?? "material.bin")
            : material.DisplayName;
        if (string.IsNullOrWhiteSpace(Path.GetExtension(downloadName))
            && !string.IsNullOrWhiteSpace(asset.OriginalFileName))
            downloadName += Path.GetExtension(asset.OriginalFileName);

        var objectKey = fileStorage.ToObjectKey(asset.FileUrl, FileAccessTier.Private);
        var remote = await fileStorage.OpenReadAsync(objectKey, cancellationToken);
        if (remote is not null)
        {
            var contentType = string.IsNullOrWhiteSpace(asset.MimeType)
                ? "application/octet-stream"
                : asset.MimeType;
            return FileOperationResult.Download(remote, contentType, Path.GetFileName(downloadName));
        }

        var legacy = legacyFiles.OpenRead(asset.FileUrl);
        return legacy is null ? FileOperationResult.Missing() : FileOperationResult.Download(legacy,
            string.IsNullOrWhiteSpace(asset.MimeType) ? "application/octet-stream" : asset.MimeType,
            Path.GetFileName(downloadName));
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = actor.Principal?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }
}
