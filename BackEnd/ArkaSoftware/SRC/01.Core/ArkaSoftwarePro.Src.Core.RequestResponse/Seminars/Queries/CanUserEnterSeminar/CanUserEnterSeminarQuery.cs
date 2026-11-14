using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.CanUserEnterSeminar
{
    public class CanUserEnterSeminarQuery : IQuery<CanUserEnterSeminarQri>, IWebRequest
    {
        public long SeminarId { get; set; }
        public long UserId { get; set; }
        public string Path => "/api/Service/Seminar/CanUserEnter";
    }

    public class CanUserEnterSeminarQri
    {
        public bool CanEnter { get; set; }
        public string? Reason { get; set; }
        public string? EntryLink { get; set; }
    }
}
