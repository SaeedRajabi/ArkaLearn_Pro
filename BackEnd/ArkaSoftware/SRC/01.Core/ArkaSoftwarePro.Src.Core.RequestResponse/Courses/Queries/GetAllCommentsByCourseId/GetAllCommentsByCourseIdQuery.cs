using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetAllCommentsByCourseId
{
    public class GetAllCommentsByCourseIdQuery: PageQuery<PagedData<GetAllCommentsByCourseIdQri>>, IWebRequest
    {
        public long CourseId { get; set; }
        public bool? OnlyApproved { get; set; } = false;
        public string Path => "/api/Service/Course/Comments/GetAlls";
    }
}
