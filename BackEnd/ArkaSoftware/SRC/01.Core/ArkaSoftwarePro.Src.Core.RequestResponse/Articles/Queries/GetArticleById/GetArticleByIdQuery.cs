using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetArticleById
{
    [CacheableQuery(CacheRegion.Articles)]
    public class GetArticleByIdQuery : IQuery<ArticleQri>, IWebRequest
    {
        public long ArticleId { get; set; }
        public string Path => "/api/Service/Article/GetById";
    }
}
