using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetMyArticles;

public class GetMyArticlesQuery : PageQuery<PagedData<SearchArticles.SearchArticleQri>>, IWebRequest
{
    public string InputValue { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string Path => "/api/Service/Article/GetMyArticles";
}
