using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyFavoriteSeminars
{
    public class GetMyFavoriteSeminarsQuery : IQuery<List<GetMyFavoriteSeminarQri>>, IWebRequest
    {
        public long UserId { get; set; }
        public string Path => "/api/Service/Seminar/GetMyFavoriteSeminars";
    }
}
