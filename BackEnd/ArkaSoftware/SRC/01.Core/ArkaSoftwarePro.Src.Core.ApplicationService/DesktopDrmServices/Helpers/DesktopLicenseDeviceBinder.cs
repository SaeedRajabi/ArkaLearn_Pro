using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers;

public static class DesktopLicenseDeviceBinder
{
    public static DesktopOsFamily ResolveOsFamily(string? osVersion)
    {
        if (string.IsNullOrWhiteSpace(osVersion))
            return DesktopOsFamily.Windows;

        var v = osVersion.ToLowerInvariant();
        if (v.Contains("mac") || v.Contains("darwin"))
            return DesktopOsFamily.Mac;
        if (v.Contains("linux"))
            return DesktopOsFamily.Linux;
        return DesktopOsFamily.Windows;
    }

    public static bool IsOsAllowed(DesktopOsFamily allowedOs, DesktopOsFamily deviceOs)
    {
        if (allowedOs == DesktopOsFamily.All)
            return true;
        if (allowedOs == DesktopOsFamily.None)
            return false;
        return allowedOs.HasFlag(deviceOs);
    }

    public static async Task<(bool Success, string? ErrorMessage)> TryBindOrValidateAsync(
        Enrollment enrollment,
        string deviceId,
        string? osVersion,
        string? machineName,
        IDesktopDrmCommandRepository drmRepository,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(deviceId))
            return (false, "شناسه دستگاه نامعتبر است.");

        var normalized = deviceId.Trim();
        var osFamily = ResolveOsFamily(osVersion);
        var maxDevices = Math.Max(1, enrollment.DesktopLicenseMaxDevices);

        if (!IsOsAllowed(enrollment.DesktopLicenseAllowedOs, osFamily))
            return (false, "سیستم‌عامل این دستگاه برای این لایسنس مجاز نیست.");

        var activeBindings = await drmRepository.ListActiveDeviceBindingsAsync(enrollment.Id, cancellationToken);
        var existing = activeBindings.FirstOrDefault(b =>
            string.Equals(b.DeviceId, normalized, StringComparison.OrdinalIgnoreCase));
        if (existing is not null)
        {
            // Bindings table is source of truth — never let legacy BoundDeviceId block MaxDevices > 1.
            SyncLegacyBoundDeviceId(enrollment, normalized, maxDevices);
            return (true, null);
        }

        if (activeBindings.Count >= maxDevices)
        {
            // Same PC after Windows reinstall often gets a new DeviceId while MachineName stays.
            var sameMachine = FindSameMachineBinding(activeBindings, machineName);
            if (sameMachine is not null)
            {
                sameMachine.Revoke("Replaced after OS reinstall / same machine rebind");
                var replaced = DesktopLicenseDeviceBinding.Activate(enrollment.Id, normalized, osFamily, machineName);
                await drmRepository.InsertDeviceBindingAsync(replaced, cancellationToken);
                SyncLegacyBoundDeviceId(enrollment, normalized, maxDevices);
                return (true, null);
            }

            return (false,
                $"این لایسنس قبلاً روی {activeBindings.Count} از {maxDevices} دستگاه مجاز فعال شده است. " +
                "برای فعال‌سازی روی سیستم جدید باید یکی از دستگاه‌های قبلی از داشبورد ادمین ریست یا لغو شود. " +
                "اگر ویندوز همین سیستم را دوباره نصب کرده‌اید، از ادمین بخواهید «ریست همه دستگاه‌ها» را بزند.");
        }

        var newBinding = DesktopLicenseDeviceBinding.Activate(enrollment.Id, normalized, osFamily, machineName);
        await drmRepository.InsertDeviceBindingAsync(newBinding, cancellationToken);
        SyncLegacyBoundDeviceId(enrollment, normalized, maxDevices);
        return (true, null);
    }

    /// <summary>
    /// Legacy single-column lock must never reject a 2nd device when MaxDevices allows it.
    /// For multi-device licenses clear it; for single-device keep it in sync with the active binding.
    /// </summary>
    private static void SyncLegacyBoundDeviceId(Enrollment enrollment, string normalizedDeviceId, int maxDevices)
    {
        if (maxDevices > 1)
        {
            enrollment.ClearDesktopLicenseDeviceBinding();
            return;
        }

        enrollment.ClearDesktopLicenseDeviceBinding();
        enrollment.TryBindOrValidateDesktopLicenseDevice(normalizedDeviceId, out _);
    }

    private static DesktopLicenseDeviceBinding? FindSameMachineBinding(
        IReadOnlyList<DesktopLicenseDeviceBinding> activeBindings,
        string? machineName)
    {
        var name = NormalizeMachineName(machineName);
        if (string.IsNullOrWhiteSpace(name))
            return null;

        return activeBindings.FirstOrDefault(b =>
            string.Equals(NormalizeMachineName(b.MachineName), name, StringComparison.OrdinalIgnoreCase));
    }

    private static string? NormalizeMachineName(string? machineName)
    {
        if (string.IsNullOrWhiteSpace(machineName))
            return null;
        return machineName.Trim().TrimEnd('$');
    }
}
