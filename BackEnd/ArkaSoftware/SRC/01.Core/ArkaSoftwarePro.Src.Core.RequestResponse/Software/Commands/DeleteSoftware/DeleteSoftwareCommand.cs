using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Software.Commands.DeleteSoftware;

[InvalidatesCache(CacheRegion.Software)]
public class DeleteSoftwareCommand : ICommand<string>, IWebRequest
{
    public long SoftwareId { get; set; }
    public string Path => "/api/Service/Software/Delete";
}
