using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Queries.GetUnreadNotificationCount;

public class GetUnreadNotificationCountQuery : IQuery<int>, IWebRequest
{
    public long UserId { get; set; }

    public string Path => "/api/Service/UserNotification/UnreadCount";
}
