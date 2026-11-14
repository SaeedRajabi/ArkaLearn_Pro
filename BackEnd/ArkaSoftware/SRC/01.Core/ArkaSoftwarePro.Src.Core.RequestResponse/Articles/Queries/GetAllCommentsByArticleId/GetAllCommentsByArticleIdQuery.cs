using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetAllCommentsByArticleId
{
    public class GetAllCommentsByArticleIdQuery : PageQuery<PagedData<GetAllCommentsByArticleIdQri>>, IWebRequest
    {
        /// <summary>0 or null = return all article comments (for admin). Set to article id to filter.</summary>
        public long? ArticleId { get; set; }
        /// <summary>If true, only approved comments. For admin list use false to see all.</summary>
        public bool? OnlyApproved { get; set; } = true;
        public string Path => "/api/Service/Article/get-comments";
    }
}
