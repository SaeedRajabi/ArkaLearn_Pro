using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Queries.GetMyNotifications;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserNotificationServices.Queries;

public class GetMyNotificationsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserNotificationQueriesRepository repository)
    : QueryHandler<GetMyNotificationsQuery, PagedUserNotificationsQri>(outer)
{
    public override async Task<QueryResult<PagedUserNotificationsQri>> Handle(GetMyNotificationsQuery query)
    {
        if (query.UserId <= 0)
        {
            return await ResultAsync(new PagedUserNotificationsQri
            {
                Page = 1,
                PageSize = 5,
                TotalCount = 0,
                Items = [],
            }, ApplicationServiceStatus.Ok);
        }

        var page = query.Page <= 0 ? 1 : query.Page;
        var pageSize = query.PageSize <= 0 ? 5 : Math.Min(query.PageSize, 50);
        var (items, total) = await repository.GetMyNotificationsPagedAsync(query.UserId, page, pageSize);

        return await ResultAsync(new PagedUserNotificationsQri
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
            Items = items,
        }, ApplicationServiceStatus.Ok);
    }
}
