using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectById;

[CacheableQuery(CacheRegion.Projects)]
public class GetProjectByIdQuery : IQuery<ProjectQri>, IWebRequest
{
    public long ProjectId { get; set; }
    public string Path => "/api/Service/Project/GetById";
}
