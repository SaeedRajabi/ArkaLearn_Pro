using ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopPlaybackPackage;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Queries;

public class GetDesktopPlaybackPackageQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmQueryRepository repository,
    IMediaEncryptionService encryptionService,
    DesktopAccessEvaluator accessEvaluator)
    : QueryHandler<GetDesktopPlaybackPackageQuery, DesktopPlaybackPackageQri>(outer)
{
    public override async Task<QueryResult<DesktopPlaybackPackageQri>> Handle(GetDesktopPlaybackPackageQuery query)
    {
        if (query.UserId <= 0 || query.MediaAssetId <= 0 || string.IsNullOrWhiteSpace(query.GrantToken))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var access = await accessEvaluator.EvaluateAsync(query.UserId, query.DeviceId, checkVideoPlayback: true);
        if (!access.IsAllowed)
        {
            AddMessage(access.BlockReason ?? "Desktop video access is blocked.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        var package = await repository.GetPlaybackPackageAsync(
            query.UserId,
            query.MediaAssetId,
            query.GrantToken,
            query.DeviceId);
        if (package is null)
        {
            AddMessage(
                "بسته پخش برای این دستگاه یافت نشد. اگر لایسنس چنددستگاهی است، از ادمین بخواهید دستگاه‌ها را ریست کند یا دوباره لایسنس را در همین سیستم تأیید کنید.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        var wrapToken = string.IsNullOrWhiteSpace(query.GrantToken)
            ? query.UserId.ToString()
            : query.GrantToken;

        if (!string.IsNullOrWhiteSpace(package.ContentKeyId))
        {
            package.WrappedContentKeyBase64 = encryptionService.WrapContentKeyForGrant(
                package.ContentKeyId,
                wrapToken);
        }

        package.ContentKeyId = string.Empty;

        var deviceQs = string.IsNullOrWhiteSpace(query.DeviceId)
            ? string.Empty
            : $"&deviceId={Uri.EscapeDataString(query.DeviceId)}";

        // Point clients at the authenticated download endpoint (avoids 404 from StaticFiles / wrong host).
        package.EncryptedFileUrl =
            $"DesktopDrm/DownloadEncrypted?mediaAssetId={package.MediaAssetId}&grantToken={Uri.EscapeDataString(query.GrantToken)}{deviceQs}";

        return await ResultAsync(package, ApplicationServiceStatus.Ok);
    }
}
