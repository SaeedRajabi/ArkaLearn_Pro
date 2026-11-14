using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.SearchProjects;

[CacheableQuery(CacheRegion.Projects)]
public class SearchProjectByInputValueQuery : PageQuery<PagedData<SearchProjectQri>>, IWebRequest
{
    public string? InputValue { get; set; }
    public string? Tag { get; set; }
    public string? Technology { get; set; }
    public bool? PublishedOnly { get; set; }
    public string Path => "/api/Service/Project/Search";
}
