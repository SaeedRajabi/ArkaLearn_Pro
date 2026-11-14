using ArkaSoftwarePro.Src.Core.Domain.Caching;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectById;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectBySlug;

[CacheableQuery(CacheRegion.Projects)]
public class GetProjectBySlugQuery : IQuery<ProjectQri>, IWebRequest
{
    public string Slug { get; set; } = string.Empty;
    public string Path => "/api/Service/Project/GetBySlug";
}
