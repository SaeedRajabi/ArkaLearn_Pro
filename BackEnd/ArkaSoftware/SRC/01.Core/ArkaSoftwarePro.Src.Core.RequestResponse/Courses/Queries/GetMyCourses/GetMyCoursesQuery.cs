using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyCourses
{
    public class GetMyCoursesQuery : IQuery<List<GetMyCoursesQri>> , IWebRequest
    {
        public long UserId { get; set; }
        public string Path => "api/Service/Tag/GetMyCourse";
    }
}
