using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomWithRoomId;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomBySlug
{
    public class GetRoomBySlugQuery : IQuery<GetRoomByRoomIdQri>, IWebRequest
    {
        public string Slug { get; set; } = string.Empty;
        public string Path => "/api/Service/Room/GetBySlug";
    }
}
