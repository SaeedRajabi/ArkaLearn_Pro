using System.Security.Cryptography;
using System.Text;
using ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RequestOfflinePlaybackGrant;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Commands;

public class RequestOfflinePlaybackGrantCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmCommandRepository drmRepository,
    IDesktopDrmQueryRepository drmQueryRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    DesktopAccessEvaluator accessEvaluator)
    : CommandHandler<RequestOfflinePlaybackGrantCommand, OfflinePlaybackGrantQri>(outer)
{
    public override async Task<CommandResult<OfflinePlaybackGrantQri>> Handle(RequestOfflinePlaybackGrantCommand command)
    {
        if (command.UserId <= 0 || command.CourseId <= 0)
            return await ResultAsync(new OfflinePlaybackGrantQri(), ApplicationServiceStatus.ValidationError);

        if (string.IsNullOrWhiteSpace(command.DeviceId))
        {
            AddMessage("شناسه دستگاه برای دریافت مجوز پخش الزامی است.");
            return await ResultAsync(new OfflinePlaybackGrantQri(), ApplicationServiceStatus.ValidationError);
        }

        var access = await accessEvaluator.EvaluateAsync(command.UserId, command.DeviceId, checkVideoPlayback: true);
        if (!access.IsAllowed)
        {
            AddMessage(access.BlockReason ?? "Desktop video access is blocked.");
            return await ResultAsync(new OfflinePlaybackGrantQri(), ApplicationServiceStatus.ValidationError);
        }

        var enrolled = await drmQueryRepository.IsUserEnrolledInCourseAsync(command.UserId, command.CourseId);
        var license = await drmRepository.GetActiveLicenseAsync(command.UserId);
        if (!enrolled && (license is null || !license.IsUsable(DateTime.UtcNow)))
            return await ResultAsync(new OfflinePlaybackGrantQri(), ApplicationServiceStatus.InvalidDomainState);

        // Bind course enrollment license to this physical device (MaxDevices-aware).
        var enrollmentDeviceAuthorized = false;
        long? enrollmentId = null;
        if (enrolled)
        {
            var enrollment = await enrollmentCommandRepository.GetByUserIdAndCourseAsync(command.UserId, command.CourseId);
            if (enrollment is null)
            {
                AddMessage("ثبت‌نام این دوره برای حساب شما یافت نشد.");
                return await ResultAsync(new OfflinePlaybackGrantQri(), ApplicationServiceStatus.ValidationError);
            }

            if (string.IsNullOrWhiteSpace(enrollment.DesktopLicenseKey)
                || !enrollment.IsDesktopLicenseCurrentlyValid(DateTime.UtcNow))
            {
                AddMessage("لایسنس دسکتاپ این دوره فعال نیست. ابتدا کلید لایسنس را در پخش‌کننده وارد کنید.");
                return await ResultAsync(new OfflinePlaybackGrantQri(), ApplicationServiceStatus.ValidationError);
            }

            enrollmentId = enrollment.Id;
            string? osVersion = command.OsVersion;
            string? machineName = command.MachineName;
            if (string.IsNullOrWhiteSpace(osVersion) && !string.IsNullOrWhiteSpace(command.DeviceId))
            {
                var registration = await drmRepository.GetDeviceRegistrationAsync(command.UserId, command.DeviceId);
                osVersion = registration?.OsVersion;
                machineName ??= registration?.MachineName;
            }

            var (bound, enrollmentBindError) = await DesktopLicenseDeviceBinder.TryBindOrValidateAsync(
                enrollment,
                command.DeviceId,
                osVersion,
                machineName,
                drmRepository);

            if (!bound)
            {
                AddMessage(enrollmentBindError ?? "لایسنس این دوره روی سیستم دیگری فعال است.");
                return await ResultAsync(new OfflinePlaybackGrantQri(), ApplicationServiceStatus.ValidationError);
            }

            enrollmentDeviceAuthorized = true;
            await enrollmentCommandRepository.CommitAsync();
            await drmRepository.CommitAsync();
        }

        // Course enrollment playback is authorized per MaxDevices bindings — never pin the
        // shared DesktopAppLicense fingerprint to a single machine (that breaks device #2).
        if (license is null || !license.IsUsable(DateTime.UtcNow))
        {
            license = DesktopAppLicense.Issue(
                command.UserId,
                null,
                null,
                enrollmentDeviceAuthorized ? null : command.DeviceId);
            await drmRepository.InsertLicenseAsync(license);
            await drmRepository.CommitAsync();
        }
        else if (enrollmentDeviceAuthorized)
        {
            if (!string.IsNullOrWhiteSpace(license.DeviceFingerprint))
            {
                license.ClearDeviceFingerprint();
                await drmRepository.CommitAsync();
            }
        }
        else if (!license.TryBindOrValidateDevice(command.DeviceId, out var licenseBindError))
        {
            AddMessage(licenseBindError ?? "لایسنس ویدیو روی سیستم دیگری فعال است.");
            return await ResultAsync(new OfflinePlaybackGrantQri(), ApplicationServiceStatus.ValidationError);
        }
        else
        {
            await drmRepository.CommitAsync();
        }

        if (license.Id <= 0)
        {
            AddMessage("Desktop app license could not be persisted.");
            return await ResultAsync(new OfflinePlaybackGrantQri(), ApplicationServiceStatus.Exception);
        }

        // Per-device grants: do not revoke another device's active grant when MaxDevices > 1.
        var existing = await drmRepository.GetActiveGrantForDeviceAsync(
            command.UserId,
            command.CourseId,
            command.DeviceId);
        if (existing is not null && existing.IsValid(DateTime.UtcNow))
            existing.Revoke();

        var grantToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        var jti = Guid.NewGuid().ToString("N");
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(grantToken)));

        var grant = OfflinePlaybackGrant.Issue(
            license.Id,
            command.UserId,
            command.CourseId,
            jti,
            hash,
            enrollmentId: enrollmentId,
            deviceId: command.DeviceId,
            ttlHours: OfflinePlaybackGrant.DefaultTtlHours);

        await drmRepository.InsertAsync(grant);
        await drmRepository.CommitAsync();

        return await OkAsync(new OfflinePlaybackGrantQri
        {
            GrantToken = grantToken,
            CourseId = command.CourseId,
            ExpiresAtUtc = grant.ExpiresAtUtc,
            TtlHours = OfflinePlaybackGrant.DefaultTtlHours,
        });
    }
}
