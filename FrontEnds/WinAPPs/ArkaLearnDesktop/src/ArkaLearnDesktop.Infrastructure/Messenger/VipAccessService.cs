using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.Infrastructure.Messenger;

public sealed class VipAccessService(IDesktopApiClient api, IAuthSessionStore sessionStore) : IVipAccessService
{
    public async Task<bool> HasActiveVipSupportAsync(CancellationToken cancellationToken = default)
    {
        var user = await sessionStore.GetCurrentUserAsync(cancellationToken);
        if (user is null) return false;

        var role = user.Role?.Trim() ?? string.Empty;
        if (role.Contains("teacher", StringComparison.OrdinalIgnoreCase) ||
            role.Contains("professor", StringComparison.OrdinalIgnoreCase) ||
            role.Contains("admin", StringComparison.OrdinalIgnoreCase))
            return true;

        return await api.GetVipAccessAsync(cancellationToken);
    }
}
