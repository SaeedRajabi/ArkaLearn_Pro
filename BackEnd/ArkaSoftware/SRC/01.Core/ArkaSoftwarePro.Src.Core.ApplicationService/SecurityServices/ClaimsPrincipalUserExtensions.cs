using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;

/// <summary>
/// Resolves the signed-in user's numeric id from cookie or JWT claims (inbound JWT often uses "sub" only).
/// </summary>
public static class ClaimsPrincipalUserExtensions
{
    public static bool TryGetLongUserId(this ClaimsPrincipal? user, out long userId)
    {
        userId = 0;
        if (user?.Identity?.IsAuthenticated != true) return false;

        foreach (var value in EnumerateUserIdClaimValues(user))
        {
            if (!string.IsNullOrWhiteSpace(value) && long.TryParse(value, out userId))
                return true;
        }

        return false;
    }

    private static IEnumerable<string> EnumerateUserIdClaimValues(ClaimsPrincipal user)
    {
        string?[] types =
        [
            ClaimTypes.NameIdentifier,
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
            "userId",
            "sub",
        ];
        foreach (var type in types)
        {
            var v = user.FindFirst(type)?.Value;
            if (!string.IsNullOrWhiteSpace(v)) yield return v;
        }
    }
}
