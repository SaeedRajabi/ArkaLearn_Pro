using ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Queries.GetMyNotifications;
using Framework.Src.Core.Contracts.Data.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Queries;

public interface IUserNotificationQueriesRepository : IQueryRepository
{
    Task<(List<UserNotificationQri> Items, int TotalCount)> GetMyNotificationsPagedAsync(
        long userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(long userId);
}
