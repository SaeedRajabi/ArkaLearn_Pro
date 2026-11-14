using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;

public static class ClaimsPrincipalRoleExtensions
{
    public static bool IsDashboardAdminRole(this ClaimsPrincipal? user)
    {
        if (user?.Identity?.IsAuthenticated != true) return false;

        foreach (var claim in user.Claims)
        {
            if (claim.Type is not (ClaimTypes.Role or "role" or "Role" or "roleName" or "RoleName"))
                continue;

            var value = claim.Value?.Trim();
            if (string.IsNullOrEmpty(value))
                continue;

            if (string.Equals(value, "admin", StringComparison.OrdinalIgnoreCase)
                || string.Equals(value, "administrator", StringComparison.OrdinalIgnoreCase)
                || value.Contains("admin", StringComparison.OrdinalIgnoreCase)
                || value.Contains("ادمین", StringComparison.Ordinal)
                || value == "3")
                return true;
        }

        return user.IsInRole("ADMIN")
            || user.IsInRole("admin")
            || user.IsInRole("Administrator")
            || user.IsInRole("ادمین");
    }

    public static bool IsStaffProfessorRole(this ClaimsPrincipal? user)
    {
        if (user?.Identity?.IsAuthenticated != true) return false;
        if (user.IsDashboardAdminRole()) return true;

        foreach (var claim in user.Claims)
        {
            if (claim.Type is not (ClaimTypes.Role or "role" or "Role" or "roleName" or "RoleName"))
                continue;

            var value = claim.Value?.Trim();
            if (string.IsNullOrEmpty(value))
                continue;

            if (string.Equals(value, "teacher", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(value, "professor", StringComparison.OrdinalIgnoreCase) ||
                value.Contains("teacher", StringComparison.OrdinalIgnoreCase) ||
                value.Contains("professor", StringComparison.OrdinalIgnoreCase) ||
                value.Contains("استاد", StringComparison.Ordinal) ||
                value == "2")
                return true;
        }

        return user.IsInRole("TEACHER")
            || user.IsInRole("teacher")
            || user.IsInRole("Professor")
            || user.IsInRole("professor")
            || user.IsInRole("استاد");
    }
}
