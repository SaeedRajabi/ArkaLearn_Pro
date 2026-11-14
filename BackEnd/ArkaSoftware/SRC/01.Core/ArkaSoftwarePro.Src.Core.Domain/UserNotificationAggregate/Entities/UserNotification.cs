using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;

public class UserNotification : AggregateRoot
{
    public long UserId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    public string Type { get; private set; } = string.Empty;
    public string? LinkUrl { get; private set; }
    public long? RelatedEntityId { get; private set; }
    public bool IsRead { get; private set; }
    public DateTime? ReadAt { get; private set; }

    private UserNotification() { }

    public static UserNotification Create(
        long userId,
        string title,
        string body,
        string type,
        string? linkUrl = null,
        long? relatedEntityId = null)
    {
        return new UserNotification
        {
            UserId = userId,
            Title = title?.Trim() ?? string.Empty,
            Body = body?.Trim() ?? string.Empty,
            Type = type?.Trim() ?? string.Empty,
            LinkUrl = linkUrl,
            RelatedEntityId = relatedEntityId,
            IsRead = false,
        };
    }

    public void MarkRead()
    {
        if (IsRead)
            return;

        IsRead = true;
        ReadAt = DateTime.UtcNow;
    }

    public void Remove()
    {
        if (IsDelete)
            return;

        IsDelete = true;
    }
}
