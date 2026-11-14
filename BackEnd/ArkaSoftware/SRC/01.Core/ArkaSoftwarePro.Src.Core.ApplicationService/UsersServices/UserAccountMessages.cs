using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices;

public static class UserAccountMessages
{
    public const string Blocked =
        "Account blocked. Contact Arka Software support to restore access.";

    public static bool IsBlocked(UserStatus status) => status == UserStatus.BLOCKED;

    public static bool IsBlockedStatus(string? status) =>
        string.Equals(status?.Trim(), UserStatus.BLOCKED.ToString(), StringComparison.OrdinalIgnoreCase);
}
