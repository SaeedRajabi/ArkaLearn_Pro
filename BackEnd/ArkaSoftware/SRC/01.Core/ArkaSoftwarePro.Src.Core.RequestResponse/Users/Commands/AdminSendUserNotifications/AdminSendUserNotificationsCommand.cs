using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminSendUserNotifications;

public class AdminSendUserNotificationsCommand : ICommand<AdminSendUserNotificationsResult>, IWebRequest
{
    public List<long> UserIds { get; set; } = [];
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public string Path => "/api/Service/AdminUserManagement/SendNotifications";
}

public class AdminSendUserNotificationsResult
{
    public int Created { get; set; }
}
