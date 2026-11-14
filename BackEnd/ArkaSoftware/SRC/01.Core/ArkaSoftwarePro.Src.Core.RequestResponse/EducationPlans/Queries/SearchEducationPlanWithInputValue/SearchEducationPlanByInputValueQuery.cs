using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.SearchEducationPlanWithInputValue
{
    public class SearchEducationPlanByInputValueQuery: PageQuery<PagedData<SearchEducationPlanQri>>, IWebRequest
    {
        public string? InputValue { get; set; } = string.Empty;
        public long? OwnerUserId { get; set; }
        public string Path => "/api/Service/Course/SearchCoursePlan";
    }
}
