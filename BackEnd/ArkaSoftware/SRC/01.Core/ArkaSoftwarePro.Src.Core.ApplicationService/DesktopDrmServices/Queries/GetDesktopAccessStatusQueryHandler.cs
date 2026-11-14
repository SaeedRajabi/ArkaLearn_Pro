using ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RegisterDesktopDevice;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopAccessStatus;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Queries;

public class GetDesktopAccessStatusQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    DesktopAccessEvaluator accessEvaluator)
    : QueryHandler<GetDesktopAccessStatusQuery, DesktopAccessStatusQri>(outer)
{
    public override async Task<QueryResult<DesktopAccessStatusQri>> Handle(GetDesktopAccessStatusQuery query)
    {
        if (query.UserId <= 0)
            return await ResultAsync(new DesktopAccessStatusQri { IsAllowed = false }, ApplicationServiceStatus.ValidationError);

        var status = await accessEvaluator.EvaluateAsync(
            query.UserId,
            query.DeviceId,
            query.CheckVideoPlayback);

        return await ResultAsync(status, ApplicationServiceStatus.Ok);
    }
}
