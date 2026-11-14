using ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Queries.GetAllMessageInRoom;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomsWithOwnerId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomUsersWithRoomId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomWithRoomId;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Queries
{
    public interface IRoomCacheQueryRepository
    {
        Task<PagedData<GetAllRoomsByOwnerIdQri>?> GetAllOwnerRoomWithCacheExecuteAsync(GetAllRoomsByOwnerIdQuery query);
        Task<PagedData<GetAllRoomUserByRoomIdQri>?> GetAllRoomUserByRoomIdWithCacheExecuteAsync(GetAllRoomUserByRoomIdQuery query);
        Task<GetRoomByRoomIdQri> GetRoomByRoomIdWithCacheExecuteAsync(GetRoomByRoomIdQuery query);
        Task<PagedData<GetAllMessageWithRoomIdQri>> GetAllMessageWithWithCacheRoomId(GetAllMessageWithRoomIdQuery query);

    }
}
