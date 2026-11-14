using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetMyFavoriteArticleIds
{
    public class GetMyFavoriteArticleIdsQuery : IQuery<List<long>>, IWebRequest
    {
        public long UserId { get; set; }
        public string Path => "/api/Service/Article/GetMyFavoriteArticleIds";
    }
}
