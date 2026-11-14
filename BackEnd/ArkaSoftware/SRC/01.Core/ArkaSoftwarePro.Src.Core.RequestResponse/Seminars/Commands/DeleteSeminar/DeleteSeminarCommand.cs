using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.DeleteSeminar;

[InvalidatesCache(CacheRegion.Seminars)]
public class DeleteSeminarCommand : ICommand<string>, IWebRequest
{
    public long SeminarId { get; set; }
    public string Path => "/api/Service/Seminar/Delete";
}
