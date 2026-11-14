using ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopEncryptedMedia;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Queries;

public class GetDesktopEncryptedMediaQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmQueryRepository repository,
    DesktopAccessEvaluator accessEvaluator)
    : QueryHandler<GetDesktopEncryptedMediaQuery, List<DesktopEncryptedMediaQri>>(outer)
{
    public override async Task<QueryResult<List<DesktopEncryptedMediaQri>>> Handle(GetDesktopEncryptedMediaQuery query)
    {
        if (query.UserId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);

        var access = await accessEvaluator.EvaluateAsync(query.UserId, query.DeviceId, checkVideoPlayback: true);
        if (!access.IsAllowed)
        {
            AddMessage(access.BlockReason ?? "Desktop video access is blocked.");
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);
        }

        var items = await repository.ListAccessibleEncryptedMediaAsync(query.UserId);
        return await ResultAsync(items, ApplicationServiceStatus.Ok);
    }
}