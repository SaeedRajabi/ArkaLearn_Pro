using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Queries.GetUnreadNotificationCount;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserNotificationServices.Queries;

public class GetUnreadNotificationCountQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserNotificationQueriesRepository repository)
    : QueryHandler<GetUnreadNotificationCountQuery, int>(outer)
{
    public override async Task<QueryResult<int>> Handle(GetUnreadNotificationCountQuery query)
    {
        if (query.UserId <= 0)
            return await ResultAsync(0, ApplicationServiceStatus.Ok);

        var count = await repository.GetUnreadCountAsync(query.UserId);
        return await ResultAsync(count, ApplicationServiceStatus.Ok);
    }
}
