using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Services;

public sealed class RoomAccessService(ArkaSoftwareCommandDbContext db) : IRoomAccessService
{
    public async Task<bool> CanAccessAsync(long roomId, ClaimsPrincipal? user, bool requireManagement = false, CancellationToken cancellationToken = default)
    {
        if (roomId <= 0 || user?.Identity?.IsAuthenticated != true) return false;
        if (user.FindFirst("identityScope")?.Value == "room-seat")
        {
            if (requireManagement || !long.TryParse(user.FindFirst("roomId")?.Value, out var scopedRoom) || scopedRoom != roomId ||
                !long.TryParse(user.FindFirst("roomSeatId")?.Value, out var seatId)) return false;
            return await db.Rooms.AnyAsync(r => r.Id == roomId && !r.IsDelete && r.RoomUsers.Any(s => s.Id == seatId && !s.IsDelete && !s.IsBlocked), cancellationToken);
        }
        if (!long.TryParse(user.FindFirst("userId")?.Value ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var userId)) return false;
        var admin = user.Claims.Any(c => c.Type == ClaimTypes.Role &&
            (c.Value.Equals("ADMIN", StringComparison.OrdinalIgnoreCase) || c.Value.Equals("SUPERADMIN", StringComparison.OrdinalIgnoreCase)));
        return await db.Rooms.AnyAsync(r => r.Id == roomId && !r.IsDelete && (admin || r.UserId == userId), cancellationToken);
    }
}
