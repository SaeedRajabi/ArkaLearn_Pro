using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class RoomCommandRepository(ArkaSoftwareCommandDbContext dbContext)
        : BaseCommandRepository<Room, ArkaSoftwareCommandDbContext>(dbContext), IRoomCommandRepository
    {
        public async Task<Room?> GetWithFilesAsync(long roomId)
        {
            return await _dbContext.Rooms
                .Include(r => r.RoomFiles)
                .FirstOrDefaultAsync(r => r.Id == roomId);
        }

        public async Task<Room?> GetWithRoomUsersAsync(long roomId)
        {
            return await _dbContext.Rooms
                .Include(r => r.RoomUsers)
                .FirstOrDefaultAsync(r => r.Id == roomId);
        }

        public Task<int> RemoveRoomUsersWithManagedStudentIdAsync(long managedRoomStudentId) =>
            _dbContext.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM [Room].[RoomUsers] WHERE [ManagedRoomStudentId] = {managedRoomStudentId}");

        public async Task<RoomSeatLiveGate?> TryGetRoomSeatLiveGateAsync(long roomId, long roomUserId)
        {
            var row = await _dbContext.Rooms
                .AsNoTracking()
                .Where(r => r.Id == roomId)
                .SelectMany(r => r.RoomUsers)
                .Where(u => u.Id == roomUserId && !u.IsDelete)
                .Select(u => new { u.IsBlocked, u.IsOnline })
                .FirstOrDefaultAsync();
            return row == null ? null : new RoomSeatLiveGate(row.IsBlocked, row.IsOnline);
        }

        public Task<int> SyncRoomSeatPasswordHashesForManagedStudentAsync(
            long managedRoomStudentId,
            string userName,
            string? email,
            string hashPassword,
            string saltPassword)
        {
            var loginUserName = (userName ?? string.Empty).Trim();
            var loginEmail = string.IsNullOrWhiteSpace(email) ? null : email.Trim();
            return _dbContext.Database.ExecuteSqlInterpolatedAsync($@"
UPDATE [Room].[RoomUsers]
SET [HashPassword] = {hashPassword}, [SaltPassword] = {saltPassword}
WHERE [IsDelete] = 0
  AND (
    [ManagedRoomStudentId] = {managedRoomStudentId}
    OR LOWER(LTRIM(RTRIM([UserName]))) = LOWER({loginUserName})
    OR ({loginEmail} IS NOT NULL AND [Email] IS NOT NULL AND LOWER(LTRIM(RTRIM([Email]))) = LOWER({loginEmail}))
  )");
        }

        public async Task<int> SyncAllRoomSeatsFromManagedStudentAsync(
            ManagedRoomStudent managed,
            string? previousUserName = null,
            string? previousEmail = null)
        {
            var loginUserName = managed.UserName.Value.Trim();
            var loginEmail = string.IsNullOrWhiteSpace(managed.Email) ? null : managed.Email.Trim();
            var prevUserName = string.IsNullOrWhiteSpace(previousUserName) ? null : previousUserName.Trim();
            var prevEmail = string.IsNullOrWhiteSpace(previousEmail) ? null : previousEmail.Trim();

            var rooms = await _dbContext.Rooms
                .Include(r => r.RoomUsers)
                .ToListAsync();

            var updated = 0;
            foreach (var room in rooms)
            {
                foreach (var seat in room.RoomUsers.Where(u => !u.IsDelete))
                {
                    if (!SeatMatchesManagedStudent(seat, managed.Id, loginUserName, loginEmail, prevUserName, prevEmail))
                        continue;

                    seat.SyncFromManagedStudent(managed, null);
                    updated++;
                }
            }

            return updated;
        }

        private static bool SeatMatchesManagedStudent(
            RoomUser seat,
            long managedId,
            string userName,
            string? email,
            string? previousUserName,
            string? previousEmail)
        {
            if (seat.ManagedRoomStudentId == managedId)
                return true;

            if (seat.UserName != null)
            {
                if (string.Equals(seat.UserName.Value, userName, StringComparison.OrdinalIgnoreCase))
                    return true;
                if (!string.IsNullOrWhiteSpace(previousUserName) &&
                    string.Equals(seat.UserName.Value, previousUserName, StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            if (!string.IsNullOrWhiteSpace(email) && !string.IsNullOrWhiteSpace(seat.Email) &&
                string.Equals(seat.Email.Trim(), email, StringComparison.OrdinalIgnoreCase))
                return true;

            if (!string.IsNullOrWhiteSpace(previousEmail) && !string.IsNullOrWhiteSpace(seat.Email) &&
                string.Equals(seat.Email.Trim(), previousEmail, StringComparison.OrdinalIgnoreCase))
                return true;

            return false;
        }
    }
}
