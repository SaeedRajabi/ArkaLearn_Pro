using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Commands.MarkAllNotificationsRead;

public class MarkAllNotificationsReadCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }

    public string Path => "/api/Service/UserNotification/MarkAllRead";
}
