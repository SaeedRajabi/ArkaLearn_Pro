using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchCoursesWithInputValue;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchTeacherCourses;

public class SearchTeacherCoursesQuery : PageQuery<PagedData<SearchCourseQri>>, IWebRequest
{
    public long TeacherUserId { get; set; }
    public string InputValue { get; set; } = string.Empty;
    public string Path => "api/Service/Course/SearchMyCourses";
}
