using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Queries.GetMyNotifications;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Framework.Src.Utilities.OutService.DateTimes;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class UserNotificationQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IUserNotificationQueriesRepository
{
    public async Task<(List<UserNotificationQri> Items, int TotalCount)> GetMyNotificationsPagedAsync(
        long userId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = _dbContext.UserNotifications
            .AsNoTracking()
            .Where(x => !x.IsDelete && x.UserId == userId);

        var total = await baseQuery.CountAsync(cancellationToken);

        var items = await baseQuery
            .OrderByDescending(x => x.CreatedDateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new UserNotificationQri
            {
                Id = x.Id,
                Title = x.Title,
                Body = x.Body,
                Type = x.Type,
                LinkUrl = x.LinkUrl,
                RelatedEntityId = x.RelatedEntityId,
                IsRead = x.IsRead,
                CreatedAt = x.CreatedDateTime.ToPersianDateTimeString("yyyy/MM/dd - HH:mm"),
                ReadAt = x.ReadAt.HasValue
                    ? x.ReadAt.Value.ToPersianDateTimeString("yyyy/MM/dd - HH:mm")
                    : null,
            })
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<int> GetUnreadCountAsync(long userId)
    {
        return await _dbContext.UserNotifications
            .AsNoTracking()
            .CountAsync(x => !x.IsDelete && x.UserId == userId && !x.IsRead);
    }
}
