using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Queries.SearchTagByInputValue
{
    public class SearchTagQuery : PageQuery<PagedData<SearchTagQri>>, IWebRequest
    {
        public string TagName { get; set; } = string.Empty;
        public string Path => "api/Service/Tag/Search";
    }
}
