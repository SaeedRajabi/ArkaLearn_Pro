using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;

internal static class DashboardAdminRoleChecker
{
    public static bool IsDashboardAdminRole(ClaimsPrincipal? user)
    {
        if (user?.Identity?.IsAuthenticated != true)
            return false;

        foreach (var claim in user.Claims)
        {
            if (claim.Type is not (ClaimTypes.Role or "role" or "Role" or "roleName" or "RoleName"))
                continue;

            var value = claim.Value?.Trim();
            if (string.IsNullOrEmpty(value))
                continue;

            if (string.Equals(value, "admin", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(value, "administrator", StringComparison.OrdinalIgnoreCase))
                return true;

            if (value == "3")
                return true;
        }

        return user.IsInRole("ADMIN") || user.IsInRole("admin");
    }
}
