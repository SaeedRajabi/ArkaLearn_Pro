using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomUsersWithRoomId
{
    public class GetAllRoomUserByRoomIdQuery:PageQuery<PagedData<GetAllRoomUserByRoomIdQri>> , IWebRequest
    {
        public long RoomId { get; set; }
        public string? InputValue { get; set; }
        public bool IsOnline { get; set; }
        public string Path => "/api/Service/Room/GetAllRoomUsers";
    }
}
