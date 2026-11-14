using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.UpdateUserFullName
{
    public class UpdateUserFullNameCommand:ICommand<string> , IWebRequest
    {
        public string? UserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        public string Path => "api/Service/User/UpdateUserFullName";
    }
}
