using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands
{
    public interface IRoomCacheCommandRepository
    {
        Task UpdateAllRoomsAsync(List<Room> rooms);
        Task RemoveRoomsCacheAsync();
    }
}
