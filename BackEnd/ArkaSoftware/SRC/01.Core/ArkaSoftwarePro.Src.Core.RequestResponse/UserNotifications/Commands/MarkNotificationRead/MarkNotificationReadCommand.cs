using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Commands.MarkNotificationRead;

public class MarkNotificationReadCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long NotificationId { get; set; }

    public string Path => "/api/Service/UserNotification/MarkRead";
}
