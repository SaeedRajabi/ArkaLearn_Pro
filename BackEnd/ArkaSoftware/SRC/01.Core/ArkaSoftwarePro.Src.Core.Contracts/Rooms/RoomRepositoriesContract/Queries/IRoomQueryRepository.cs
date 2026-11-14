using ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Queries.GetAllMessageInRoom;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomsWithOwnerId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomUsersWithRoomId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomFilesByRoomId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomWithRoomId;
using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Queries
{
    public interface IRoomQueryRepository : IQueryRepository
    {
        Task<PagedData<GetAllRoomsByOwnerIdQri>?> GetAllOwnerRoomExecuteAsync(GetAllRoomsByOwnerIdQuery query);
        Task<PagedData<GetAllRoomUserByRoomIdQri>?> GetAllRoomUserByRoomIdExecuteAsync(GetAllRoomUserByRoomIdQuery query);
        Task<GetRoomByRoomIdQri?> GetRoomByRoomIdExecuteAsync(GetRoomByRoomIdQuery query);
        Task<GetRoomByRoomIdQri?> GetRoomBySlugExecuteAsync(GetRoomBySlugQuery query);
        Task<List<GetRoomFilesByRoomIdQri>> GetRoomFilesByRoomIdExecuteAsync(GetRoomFilesByRoomIdQuery query);
        Task<PagedData<GetAllMessageWithRoomIdQri>> GetAllMessageWithRoomId(GetAllMessageWithRoomIdQuery query);
    }
}
