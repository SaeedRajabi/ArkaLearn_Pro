using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.SearchArticles
{
    [CacheableQuery(CacheRegion.Articles)]
    public class SearchArticleByInputValueQuery : PageQuery<PagedData<SearchArticleQri>>, IWebRequest
    {
        public string InputValue { get; set; } = string.Empty;
        public bool? PublishedOnly { get; set; } = true;
        public long? CategoryId { get; set; }
        public long? AuthorUserId { get; set; }
        public string Path => "/api/Service/Article/Search";
    }
}
