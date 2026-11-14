using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetAllPopularCourse
{
    [CacheableQuery(CacheRegion.Courses)]
    public class GetAllPopularCourseQuery:PageQuery<PagedData<GetAllPopularCourseQri>> , IWebRequest
    {
        public string Path => "/api/Service/Course/GetPopular";
    }
}
