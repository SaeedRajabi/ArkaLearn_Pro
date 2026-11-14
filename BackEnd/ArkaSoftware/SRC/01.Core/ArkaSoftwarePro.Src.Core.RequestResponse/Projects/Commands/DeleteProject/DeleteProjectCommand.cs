using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Commands.DeleteProject;

[InvalidatesCache(CacheRegion.Projects)]
public class DeleteProjectCommand : ICommand<string>, IWebRequest
{
    public long Id { get; set; }
    public string Path => "/api/Service/Project/Delete";
}
