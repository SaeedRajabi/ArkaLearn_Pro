using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;

public interface IUserNotificationCommandRepository : ICommandRepository<UserNotification, long>
{
    Task InsertManyAsync(IEnumerable<UserNotification> notifications);
    Task MarkAllReadAsync(long userId);
    Task<bool> ExistsAsync(
        long userId,
        string type,
        long relatedEntityId,
        CancellationToken cancellationToken = default);

    /// <summary>True if any user already has a notification of this type for the related entity (e.g. first download of a file).</summary>
    Task<bool> ExistsForRelatedEntityAsync(
        string type,
        long relatedEntityId,
        CancellationToken cancellationToken = default);
}
