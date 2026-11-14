using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyFavoriteCourses
{
    public class GetMyFavoriteCoursesQuery : IQuery<List<GetMyFavoriteCourseQri>>, IWebRequest
    {
        public long UserId { get; set; }
        public string Path => "/api/Service/Course/GetMyFavoriteCourses";
    }
}
