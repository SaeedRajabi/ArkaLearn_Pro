using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RegisterDesktopDevice;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers;

public sealed class DesktopAccessEvaluator(IDesktopDrmCommandRepository repository)
{
    /// <summary>
    /// If another device still holds exclusive login but has not heartbeated recently
    /// (typical after OS reinstall), allow this authenticated device to continue.
    /// </summary>
    private static readonly TimeSpan StaleExclusiveLoginThreshold = TimeSpan.FromHours(12);

    public async Task<DesktopAccessStatusQri> EvaluateAsync(
        long userId,
        string? deviceId,
        bool checkVideoPlayback,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
        {
            return new DesktopAccessStatusQri
            {
                IsAllowed = false,
                IsUserBlocked = true,
                BlockReason = "کاربر نامعتبر است.",
                BlockScope = DesktopBlockScope.EntireDesktopApp.ToString(),
            };
        }

        long? deviceRegistrationId = null;
        if (!string.IsNullOrWhiteSpace(deviceId))
        {
            var normalizedDeviceId = deviceId.Trim();

            // Exclusive desktop login must NOT block course video on a 2nd licensed device.
            // Device slots are enforced by DesktopLicenseDeviceBinder (MaxDevices).
            if (!checkVideoPlayback)
            {
                var activeLogin = await repository.GetActiveLoginRegistrationAsync(userId, cancellationToken);
                if (activeLogin is not null
                    && !string.Equals(activeLogin.DeviceId, normalizedDeviceId, StringComparison.OrdinalIgnoreCase))
                {
                    var lastSeen = activeLogin.LastHeartbeatAtUtc;
                    var isStale = DateTime.UtcNow - lastSeen >= StaleExclusiveLoginThreshold;
                    if (!isStale)
                    {
                        return new DesktopAccessStatusQri
                        {
                            IsAllowed = false,
                            BlockReason = DesktopExclusiveLoginMessages.ActiveElsewhere,
                            BlockScope = DesktopBlockScope.EntireDesktopApp.ToString(),
                            DeviceRegistrationId = activeLogin.Id,
                        };
                    }

                    // Stale session from previous Windows install — free it for this device.
                    await repository.DeactivateAllActiveLoginsAsync(userId, cancellationToken);
                    await repository.CommitAsync();
                }
            }

            var device = await repository.GetDeviceRegistrationAsync(userId, normalizedDeviceId, cancellationToken);
            if (device is not null)
            {
                deviceRegistrationId = device.Id;
                if (device.IsBlocked)
                {
                    return new DesktopAccessStatusQri
                    {
                        IsAllowed = false,
                        IsDeviceBlocked = true,
                        BlockReason = "این دستگاه توسط مدیر مسدود شده است.",
                        BlockScope = DesktopBlockScope.EntireDesktopApp.ToString(),
                        DeviceRegistrationId = device.Id,
                    };
                }
            }
        }

        var userBlock = await repository.GetActiveUserAccessBlockAsync(userId, cancellationToken);
        if (userBlock is not null)
        {
            if (userBlock.Scope == DesktopBlockScope.EntireDesktopApp)
            {
                return new DesktopAccessStatusQri
                {
                    IsAllowed = false,
                    IsUserBlocked = true,
                    BlockReason = userBlock.Reason ?? "دسترسی شما به اپلیکیشن دسکتاپ مسدود شده است.",
                    BlockScope = userBlock.Scope.ToString(),
                    DeviceRegistrationId = deviceRegistrationId,
                };
            }

            if (checkVideoPlayback && userBlock.Scope == DesktopBlockScope.VideosOnly)
            {
                return new DesktopAccessStatusQri
                {
                    IsAllowed = false,
                    IsUserBlocked = true,
                    BlockReason = userBlock.Reason ?? "پخش ویدیو برای حساب شما مسدود شده است.",
                    BlockScope = userBlock.Scope.ToString(),
                    DeviceRegistrationId = deviceRegistrationId,
                };
            }
        }

        return new DesktopAccessStatusQri
        {
            IsAllowed = true,
            DeviceRegistrationId = deviceRegistrationId,
        };
    }
}
