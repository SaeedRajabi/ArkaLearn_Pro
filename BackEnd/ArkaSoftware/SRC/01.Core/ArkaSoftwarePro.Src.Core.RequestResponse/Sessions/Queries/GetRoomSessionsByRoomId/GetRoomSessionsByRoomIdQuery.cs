using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Queries.GetRoomSessionsByRoomId;

public class GetRoomSessionsByRoomIdQuery : PageQuery<PagedData<GetRoomSessionsByRoomIdQri>>
{
    public long RoomId { get; set; }
}