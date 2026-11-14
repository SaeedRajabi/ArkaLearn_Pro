using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Commands.DeleteNotification;

public class DeleteNotificationCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long NotificationId { get; set; }

    public string Path => "/api/Service/UserNotification/Delete";
}
