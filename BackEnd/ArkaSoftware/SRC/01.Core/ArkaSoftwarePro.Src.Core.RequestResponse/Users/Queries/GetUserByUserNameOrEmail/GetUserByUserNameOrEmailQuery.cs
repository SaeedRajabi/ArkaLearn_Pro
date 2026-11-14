using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByUserNameOrEmail
{
    public class GetUserByUserNameOrEmailQuery:IQuery<GetUserByUserNameOrEmailQri> , IWebRequest
    {
        public string UserNameOrEmail { get; set; } = string.Empty;
        public string Path => "api/Service/User/GetByUserNameOrEmail";
    }
}
