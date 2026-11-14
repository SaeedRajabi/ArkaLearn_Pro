using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands
{
    public interface IRoomCommandRepository : ICommandRepository<Room, long>
    {
        Task<Room?> GetWithFilesAsync(long roomId);
        /// <summary>اتاق به‌همراه کاربران اتاق (برای افزودن کاربر جدید به اتاق سمینار)</summary>
        Task<Room?> GetWithRoomUsersAsync(long roomId);

        /// <summary>Removes all room seats synced from the given catalog student.</summary>
        Task<int> RemoveRoomUsersWithManagedStudentIdAsync(long managedRoomStudentId);

        /// <summary>Returns null when no seat exists in this room for the given room user id.</summary>
        Task<RoomSeatLiveGate?> TryGetRoomSeatLiveGateAsync(long roomId, long roomUserId);

        /// <summary>
        /// Copies catalog student password hashes to room seats linked by id, username, or email.
        /// </summary>
        Task<int> SyncRoomSeatPasswordHashesForManagedStudentAsync(
            long managedRoomStudentId,
            string userName,
            string? email,
            string hashPassword,
            string saltPassword);

        /// <summary>
        /// Refreshes all room seats linked to a catalog student (credentials + profile).
        /// </summary>
        Task<int> SyncAllRoomSeatsFromManagedStudentAsync(
            ManagedRoomStudent managed,
            string? previousUserName = null,
            string? previousEmail = null);
    }
}
