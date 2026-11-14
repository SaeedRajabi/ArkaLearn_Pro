using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Commands.ApproveArticleComment
{
    public class ApproveArticleCommentCommand : ICommand<string>, IWebRequest
    {
        public long ArticleId { get; set; }
        public long CommentId { get; set; }
        public bool IsApproved { get; set; }
        public string Path => "/api/Service/Article/approve-comment";
    }
}
