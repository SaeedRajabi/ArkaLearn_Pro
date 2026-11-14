using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetSeminarRegistrations
{
    public class GetSeminarRegistrationsQuery : PageQuery<PagedData<SeminarRegistrationQri>>, IWebRequest
    {
        public long SeminarId { get; set; }
        public string Path => "/api/Service/Seminar/GetRegistrations";
    }
}
