using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.LogoutUsers
{
    public class LogoutUser : ICommand<bool>, IWebRequest
    {
        public long UserId { get; set; }

        public string Path => "/api/Service/User/Account/Logout";
    }
}
