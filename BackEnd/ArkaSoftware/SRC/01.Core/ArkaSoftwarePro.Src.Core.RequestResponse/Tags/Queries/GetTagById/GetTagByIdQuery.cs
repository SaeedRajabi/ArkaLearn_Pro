using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Queries.GetTagById
{
    public class GetTagByIdQuery : IQuery<TagQri>, IWebRequest
    {
        public long TagId { get; set; }
        public string Path => "api/Service/Tag/GetById";
    }
}
