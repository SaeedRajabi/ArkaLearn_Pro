using ArkaSoftwarePro.Src.Core.Domain.Caching;
using ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetArticleById;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetArticleBySlug
{
    [CacheableQuery(CacheRegion.Articles)]
    public class GetArticleBySlugQuery : IQuery<ArticleQri>, IWebRequest
    {
        public string Slug { get; set; } = string.Empty;
        public string Path => "/api/Service/Article/GetBySlug";
    }
}
