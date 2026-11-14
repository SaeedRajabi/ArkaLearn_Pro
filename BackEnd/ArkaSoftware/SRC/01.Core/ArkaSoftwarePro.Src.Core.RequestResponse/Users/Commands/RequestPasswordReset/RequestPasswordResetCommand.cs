using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.RequestPasswordReset;

public class RequestPasswordResetCommand : ICommand<string>, IWebRequest
{
    public string Email { get; set; } = string.Empty;
    public string Path => "/api/Service/User/RequestPasswordReset";
}
