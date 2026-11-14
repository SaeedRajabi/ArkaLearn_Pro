using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomFilesByRoomId
{
    public class GetRoomFilesByRoomIdQuery : IQuery<List<GetRoomFilesByRoomIdQri>>, IWebRequest
    {
        public long RoomId { get; set; }
        public string Path => "/api/Service/Room/GetRoomFiles";
    }
}
