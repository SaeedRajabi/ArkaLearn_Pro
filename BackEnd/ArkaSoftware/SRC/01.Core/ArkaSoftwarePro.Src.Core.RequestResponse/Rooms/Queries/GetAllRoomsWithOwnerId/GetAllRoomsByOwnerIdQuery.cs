using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomsWithOwnerId
{
    public class GetAllRoomsByOwnerIdQuery:PageQuery<PagedData<GetAllRoomsByOwnerIdQri>> , IWebRequest
    {
        public string RoomTitle { get; set; } = string.Empty;
        public long UserId { get; set; }
        public string Path => "/api/Service/Room/GetAllRoom";
    }
}
