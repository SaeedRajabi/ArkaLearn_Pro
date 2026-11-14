using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomWithRoomId
{
    public class GetRoomByRoomIdQuery:IQuery<GetRoomByRoomIdQri> , IWebRequest
    {
        public long RoomId { get; set; }
        public string Path => "api/Service/Room/ReadById";
    }

}
