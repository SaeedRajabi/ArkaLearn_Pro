using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Users.Services;

namespace ArkaSoftwarePro.Src.Endpoints.API.Adapters.Authentication;

public sealed class HttpCurrentActor(IHttpContextAccessor accessor) : ICurrentActor
{
    public ClaimsPrincipal Principal => accessor.HttpContext?.User ?? new ClaimsPrincipal(new ClaimsIdentity());
    public CancellationToken CancellationToken => accessor.HttpContext?.RequestAborted ?? CancellationToken.None;
}
