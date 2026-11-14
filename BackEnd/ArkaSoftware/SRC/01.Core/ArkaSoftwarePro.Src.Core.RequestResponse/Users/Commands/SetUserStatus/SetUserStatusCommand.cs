using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.SetUserStatus;

public class SetUserStatusCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public bool Blocked { get; set; }
    public string Path => "/api/Service/User/SetStatus";
}
