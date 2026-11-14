using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById
{
    public class GetUserByIdQuery : IQuery<UserQr?>, IWebRequest
    {
        public long UserId { get; set; }
        public string Path => "/api/Service/User/GetById";
    }
}
