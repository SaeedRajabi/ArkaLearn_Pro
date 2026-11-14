using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.DeleteArticleComment
{
    public class DeleteArticleCommentCommand : ICommand<string>, IWebRequest
    {
        public long ArticleId { get; set; }
        public long CommentId { get; set; }
        public string Path => "/api/Service/Article/delete-comment";
    }
}
