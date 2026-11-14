using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetSeminarById
{
    [CacheableQuery(CacheRegion.Seminars)]
    public class GetSeminarByIdQuery : IQuery<SeminarQri>, IWebRequest
    {
        public long SeminarId { get; set; }
        public string Path => "/api/Service/Seminar/GetById";
    }
}
