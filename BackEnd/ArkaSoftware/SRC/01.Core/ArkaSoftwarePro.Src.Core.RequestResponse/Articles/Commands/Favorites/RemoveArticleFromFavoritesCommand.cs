using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.Favorites
{
    public class RemoveArticleFromFavoritesCommand : ICommand<string>, IWebRequest
    {
        public long ArticleId { get; set; }
        public string Path => "/api/Service/Article/RemoveFromFavorites";
    }
}
