using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers;

/// <summary>
/// Clears all device locks that block desktop playback for an enrollment:
/// multi-device bindings, legacy bound device id, offline grants, app-license fingerprint,
/// and exclusive desktop login sessions so the student can activate again after OS reinstall.
/// </summary>
public static class DesktopLicenseDeviceResetHelper
{
    public static async Task ResetAsync(
        Enrollment enrollment,
        long courseId,
        long? studentUserId,
        IDesktopDrmCommandRepository drmRepository,
        string reason,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(enrollment);
        ArgumentNullException.ThrowIfNull(drmRepository);

        var revokeReason = string.IsNullOrWhiteSpace(reason)
            ? "Devices reset by teacher/admin"
            : reason.Trim();

        var activeBindings = await drmRepository.ListActiveDeviceBindingsAsync(enrollment.Id, cancellationToken);
        foreach (var binding in activeBindings)
            binding.Revoke(revokeReason);

        enrollment.ClearDesktopLicenseDeviceBinding();

        if (studentUserId is > 0)
        {
            var grants = await drmRepository.ListActiveGrantsForCourseAsync(
                studentUserId.Value,
                courseId,
                cancellationToken);
            foreach (var grant in grants)
                grant.Revoke();

            var appLicense = await drmRepository.GetActiveLicenseAsync(studentUserId.Value, cancellationToken);
            appLicense?.ClearDeviceFingerprint();

            // Windows reinstall creates a new device id; free exclusive login so they can sign in again.
            await drmRepository.DeactivateAllActiveLoginsAsync(studentUserId.Value, cancellationToken);
        }
    }
}
