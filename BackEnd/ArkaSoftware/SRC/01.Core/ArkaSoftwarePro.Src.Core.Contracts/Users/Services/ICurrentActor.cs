using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.Contracts.Users.Services;

public interface ICurrentActor
{
    ClaimsPrincipal Principal { get; }
    CancellationToken CancellationToken { get; }
}
