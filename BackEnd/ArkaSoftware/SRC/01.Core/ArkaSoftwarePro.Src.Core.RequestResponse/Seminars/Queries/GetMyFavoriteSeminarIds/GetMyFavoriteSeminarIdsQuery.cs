using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyFavoriteSeminarIds
{
    public class GetMyFavoriteSeminarIdsQuery : IQuery<List<long>>, IWebRequest
    {
        public long UserId { get; set; }
        public string Path => "/api/Service/Seminar/GetMyFavoriteSeminarIds";
    }
}
