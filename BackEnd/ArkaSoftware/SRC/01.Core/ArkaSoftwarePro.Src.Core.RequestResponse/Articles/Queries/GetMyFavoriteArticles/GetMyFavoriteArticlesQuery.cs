using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetMyFavoriteArticles
{
    public class GetMyFavoriteArticlesQuery : IQuery<List<GetMyFavoriteArticleQri>>, IWebRequest
    {
        public long UserId { get; set; }
        public string Path => "/api/Service/Article/GetMyFavoriteArticles";
    }
}
