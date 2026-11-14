using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.DeleteArticle
{
    [InvalidatesCache(CacheRegion.Articles)]
    public class DeleteArticle : ICommand<string>, IWebRequest
    {
        public long Id { get; set; }
        public string Path => "/api/Service/Article/Delete";
    }
}
