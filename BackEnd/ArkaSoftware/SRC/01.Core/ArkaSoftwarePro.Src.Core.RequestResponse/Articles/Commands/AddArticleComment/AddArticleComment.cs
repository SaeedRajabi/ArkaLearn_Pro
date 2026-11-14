using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.AddArticleComment
{
    public class AddArticleComment : ICommand<string>, IWebRequest
    {
        public long ArticleId { get; set; }
        public string Content { get; set; } = string.Empty;
        public int Rating { get; set; }
        public int Like { get; set; }
        public long? ParentId { get; set; }
        public string Path => "/api/Service/Article/add-comment";
    }
}
