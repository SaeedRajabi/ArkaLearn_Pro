using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetUserByToken
{
    public class GetUserByTokenQuery : IQuery<UserByTokenQri?>, IWebRequest
    {
        public string Token { get; set; } = string.Empty;
        public string Path => "api/Service/User/GetByToken";
    }
}
