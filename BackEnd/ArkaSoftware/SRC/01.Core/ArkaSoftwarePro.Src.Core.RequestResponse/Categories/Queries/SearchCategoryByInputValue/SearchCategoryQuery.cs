using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.SearchCategoryByInputValue
{
    [CacheableQuery(CacheRegion.Categories)]
    public class SearchCategoryQuery : PageQuery<PagedData<SearchCategoryQri>>, IWebRequest
    {
        public string CategoryName { get; set; } = string.Empty;

        public string Path => "api/Service/Category/SearchByInputValue";
    }
}
