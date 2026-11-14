using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByCookie
{
    public class GetUserByCookieQuery:IQuery<GetUserByCookieQri> , IWebRequest
    {
        public string userName { get; set; } = string.Empty;
        public string Path => "/api/Service/User/GetUser";
    }
}
