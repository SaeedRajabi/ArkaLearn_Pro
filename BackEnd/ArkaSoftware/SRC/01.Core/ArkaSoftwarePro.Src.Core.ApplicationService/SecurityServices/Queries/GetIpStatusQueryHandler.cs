using ArkaSoftwarePro.Src.Core.Contracts.IPBlacklist.IPBlacklistRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.RequestResponse.Security.Queries.GetIpStatus;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices.Queries;

public class GetIpStatusQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IIPBlacklistQueryRepository repository,
    IUserDeviceInfoService userInfoService)
    : QueryHandler<GetIpStatusQuery, IpStatusQri>(outer)
{
    public override async Task<QueryResult<IpStatusQri>> Handle(GetIpStatusQuery query)
    {
        var ip = userInfoService.GetUserInfo().IpAddress;
        var blocked = !string.IsNullOrWhiteSpace(ip) && await repository.IsIpBlockedAsync(ip);
        return await ResultAsync(new IpStatusQri { IsBlocked = blocked }, ApplicationServiceStatus.Ok);
    }
}
