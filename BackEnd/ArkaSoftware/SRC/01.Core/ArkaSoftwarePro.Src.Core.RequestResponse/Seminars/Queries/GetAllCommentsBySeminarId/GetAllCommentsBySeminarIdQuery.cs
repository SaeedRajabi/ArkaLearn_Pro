using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetAllCommentsBySeminarId
{
    public class GetAllCommentsBySeminarIdQuery : PageQuery<PagedData<GetAllCommentsBySeminarIdQri>>, IWebRequest
    {
        public long SeminarId { get; set; }
        public bool? OnlyApproved { get; set; } = true;
        public string Path => "/api/Service/Seminar/get-comments";
    }
}
