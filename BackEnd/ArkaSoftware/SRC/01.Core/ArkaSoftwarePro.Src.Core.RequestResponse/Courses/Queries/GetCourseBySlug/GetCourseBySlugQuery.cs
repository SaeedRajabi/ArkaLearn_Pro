using ArkaSoftwarePro.Src.Core.Domain.Caching;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCoursesById;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCourseBySlug;

[CacheableQuery(CacheRegion.Courses)]
public class GetCourseBySlugQuery : IQuery<CourseQri>, IWebRequest
{
    public string Slug { get; set; } = string.Empty;
    public long ViewerUserId { get; set; }
    public string Path => "api/Service/Course/GetBySlug";
}
