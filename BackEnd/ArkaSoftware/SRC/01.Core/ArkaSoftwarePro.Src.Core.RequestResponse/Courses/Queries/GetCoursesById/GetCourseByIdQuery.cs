using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCoursesById
{
    [CacheableQuery(CacheRegion.Courses)]
    // Viewer-sensitive fields (owner drafts / enrollment) — cache key includes ViewerUserId.
    public class GetCourseByIdQuery : IQuery<CourseQri>, IWebRequest
    {
        public long CourseId { get; set; }
        public long ViewerUserId { get; set; }
        public bool ViewerIsAdmin { get; set; }
        public string Path => "api/Service/Course/GetById";
    }
}
