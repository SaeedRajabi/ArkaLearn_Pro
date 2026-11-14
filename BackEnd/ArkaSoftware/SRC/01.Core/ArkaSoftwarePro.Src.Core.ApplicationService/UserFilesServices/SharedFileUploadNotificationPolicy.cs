using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserFilesServices;

internal static class SharedFileUploadNotificationPolicy
{
    public static bool ShouldNotifyManagedStudent(ClaimsPrincipal? user, bool notifyFlagFromCommand)
    {
        if (notifyFlagFromCommand)
            return true;

        if (user?.Identity?.IsAuthenticated != true)
            return false;

        return HasStaffRole(user);
    }

    private static bool HasStaffRole(ClaimsPrincipal user)
    {
        foreach (var claim in user.Claims)
        {
            if (claim.Type is not (ClaimTypes.Role or "role" or "Role" or "roleName" or "RoleName"))
                continue;

            var value = claim.Value?.Trim();
            if (string.IsNullOrEmpty(value))
                continue;

            if (string.Equals(value, "admin", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(value, "administrator", StringComparison.OrdinalIgnoreCase) ||
                value == "3")
                return true;

            if (string.Equals(value, "teacher", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(value, "professor", StringComparison.OrdinalIgnoreCase) ||
                value == "2")
                return true;
        }

        return user.IsInRole("ADMIN") ||
               user.IsInRole("admin") ||
               user.IsInRole("TEACHER") ||
               user.IsInRole("teacher");
    }
}
