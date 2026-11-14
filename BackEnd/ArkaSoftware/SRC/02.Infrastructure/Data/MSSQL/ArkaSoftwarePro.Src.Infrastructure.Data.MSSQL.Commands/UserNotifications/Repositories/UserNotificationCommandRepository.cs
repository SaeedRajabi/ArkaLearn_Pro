using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.UserNotifications.Repositories;

public class UserNotificationCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<UserNotification, ArkaSoftwareCommandDbContext>(dbContext),
      IUserNotificationCommandRepository
{
    public async Task InsertManyAsync(IEnumerable<UserNotification> notifications)
    {
        var list = notifications?.Where(x => x is not null).ToList() ?? [];
        if (list.Count == 0)
            return;

        await _dbContext.UserNotifications.AddRangeAsync(list);
    }

    public async Task MarkAllReadAsync(long userId)
    {
        if (userId <= 0)
            return;

        var now = DateTime.UtcNow;
        var unread = await _dbContext.UserNotifications
            .Where(x => x.UserId == userId && !x.IsDelete && !x.IsRead)
            .ToListAsync();

        foreach (var item in unread)
            item.MarkRead();
    }

    public Task<bool> ExistsAsync(
        long userId,
        string type,
        long relatedEntityId,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0 || relatedEntityId <= 0 || string.IsNullOrWhiteSpace(type))
            return Task.FromResult(false);

        var normalizedType = type.Trim();
        return _dbContext.UserNotifications.AsNoTracking()
            .AnyAsync(
                x => !x.IsDelete
                     && x.UserId == userId
                     && x.Type == normalizedType
                     && x.RelatedEntityId == relatedEntityId,
                cancellationToken);
    }

    public Task<bool> ExistsForRelatedEntityAsync(
        string type,
        long relatedEntityId,
        CancellationToken cancellationToken = default)
    {
        if (relatedEntityId <= 0 || string.IsNullOrWhiteSpace(type))
            return Task.FromResult(false);

        var normalizedType = type.Trim();
        return _dbContext.UserNotifications.AsNoTracking()
            .AnyAsync(
                x => !x.IsDelete
                     && x.Type == normalizedType
                     && x.RelatedEntityId == relatedEntityId,
                cancellationToken);
    }
}
