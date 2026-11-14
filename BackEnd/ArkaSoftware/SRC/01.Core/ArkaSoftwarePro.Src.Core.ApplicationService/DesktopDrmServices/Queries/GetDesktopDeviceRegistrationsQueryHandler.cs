using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopDeviceRegistrations;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Queries;

public class GetDesktopDeviceRegistrationsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmCommandRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetDesktopDeviceRegistrationsQuery, List<DesktopDeviceRegistrationAdminQri>>(outer)
{
    public override async Task<QueryResult<List<DesktopDeviceRegistrationAdminQri>>> Handle(GetDesktopDeviceRegistrationsQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);
        }

        var rows = await repository.ListDeviceRegistrationsAsync(query.UserId, query.Take);
        var items = rows.Select(x => new DesktopDeviceRegistrationAdminQri
        {
            Id = x.Id,
            UserId = x.UserId,
            DeviceId = x.DeviceId,
            MachineName = x.MachineName,
            OsVersion = x.OsVersion,
            AppVersion = x.AppVersion,
            RegisteredAtUtc = x.RegisteredAtUtc,
            LastHeartbeatAtUtc = x.LastHeartbeatAtUtc,
            IsBlocked = x.IsBlocked,
        }).ToList();

        return await ResultAsync(items, ApplicationServiceStatus.Ok);
    }
}
