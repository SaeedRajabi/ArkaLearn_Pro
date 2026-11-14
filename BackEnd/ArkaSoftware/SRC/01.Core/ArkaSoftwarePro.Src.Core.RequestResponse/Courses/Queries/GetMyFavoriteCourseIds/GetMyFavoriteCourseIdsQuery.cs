using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyFavoriteCourseIds
{
    public class GetMyFavoriteCourseIdsQuery : IQuery<List<long>>, IWebRequest
    {
        public long UserId { get; set; }
        public string Path => "/api/Service/Course/GetMyFavoriteCourseIds";
    }
}
