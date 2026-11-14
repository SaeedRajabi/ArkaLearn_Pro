using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetAllSeminarRegistrations
{
    public class GetAllSeminarRegistrationsQuery : PageQuery<PagedData<SeminarRegistrationWithSeminarQri>>, IWebRequest
    {
        /// <summary>0 = all seminars</summary>
        public long SeminarId { get; set; }
        public string Path => "/api/Service/Seminar/GetAllRegistrations";
    }
}
