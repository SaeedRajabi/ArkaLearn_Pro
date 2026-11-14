using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Security;

/// <summary>Seat identifiers must never be used as account identifiers by unrelated APIs.</summary>
public static class RoomSeatTokenScope
{
    public static bool Allows(ClaimsPrincipal? principal, PathString path)
    {
        if (principal?.FindFirst("identityScope")?.Value != "room-seat") return true;
        return path.StartsWithSegments("/api/Service/Room") || path.StartsWithSegments("/api/Message") ||
               string.Equals(path.Value?.TrimEnd('/'), "/api/Service/Account/UserRoomLogout", StringComparison.OrdinalIgnoreCase) ||
               path.StartsWithSegments("/meetingHub") || path.StartsWithSegments("/hubs/chat");
    }
}
