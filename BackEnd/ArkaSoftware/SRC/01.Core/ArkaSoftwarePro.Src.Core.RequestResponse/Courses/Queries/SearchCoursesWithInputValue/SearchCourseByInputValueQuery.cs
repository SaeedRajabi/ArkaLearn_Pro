using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchCoursesWithInputValue
{
    [CacheableQuery(CacheRegion.Courses)]
    public class SearchCourseByInputValueQuery : PageQuery<PagedData<SearchCourseQri>>, IWebRequest
    {
        public string InputValue { get; set; } = string.Empty;
        public string Path => "api/Service/Courses/SearchByInputValue";
    }
}
