using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.GetCategoryById
{
    [CacheableQuery(CacheRegion.Categories)]
    public class GetCategoryByIdQuery : IQuery<CategoryQri>, IWebRequest
    {
        public long CategoryId { get; set; }
        public string Path => "api/Service/Category/GetById";
    }
}
