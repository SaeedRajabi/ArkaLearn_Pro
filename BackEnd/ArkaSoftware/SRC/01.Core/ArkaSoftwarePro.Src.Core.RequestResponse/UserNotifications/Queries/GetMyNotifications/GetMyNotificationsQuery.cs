using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Queries.GetMyNotifications;

public class GetMyNotificationsQuery : IQuery<PagedUserNotificationsQri>, IWebRequest
{
    public long UserId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 5;

    public string Path => "/api/Service/UserNotification/GetMy";
}

public class PagedUserNotificationsQri
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public List<UserNotificationQri> Items { get; set; } = [];
}

public class UserNotificationQri
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public long? RelatedEntityId { get; set; }
    public bool IsRead { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string? ReadAt { get; set; }
}
