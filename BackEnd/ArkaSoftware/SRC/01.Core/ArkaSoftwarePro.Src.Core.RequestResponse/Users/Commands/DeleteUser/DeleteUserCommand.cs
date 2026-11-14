using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.DeleteUser;

public class DeleteUserCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public string Path => "/api/Service/User/Delete";
}
