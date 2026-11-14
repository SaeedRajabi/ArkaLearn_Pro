using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.Contracts.Rooms;

public interface IRoomAccessService
{
    Task<bool> CanAccessAsync(long roomId, ClaimsPrincipal? user, bool requireManagement = false, CancellationToken cancellationToken = default);
}
