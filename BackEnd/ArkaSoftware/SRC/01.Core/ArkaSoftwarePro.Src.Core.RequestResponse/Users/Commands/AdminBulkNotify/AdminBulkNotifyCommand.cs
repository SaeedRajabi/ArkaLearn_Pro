using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminBulkNotify;

public class AdminBulkNotifyCommand : ICommand<AdminBulkNotifyResult>, IWebRequest
{
    public List<long> UserIds { get; set; } = [];
    public string Channel { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Path => "/api/Service/AdminUserManagement/BulkNotify";
}

public class AdminBulkNotifyResult
{
    public int Sent { get; set; }
    public int Failed { get; set; }
}
