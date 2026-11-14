using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.BlockDesktopDevice;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.LogoutDesktopSession;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.ManageStudentDesktopLicense;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RegisterDesktopDevice;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.ReportDesktopPlaybackTelemetry;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RequestDesktopLicense;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RequestOfflinePlaybackGrant;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RevokeDesktopLicenseDevice;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.ResetDesktopLicenseDevices;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.SetDesktopLicenseLessonAccess;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.UpdateCourseDesktopWatermarkPolicy;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.UpdateDesktopLicenseLimits;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.UpsertTeacherStudentSatisfaction;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetCourseDesktopAnalytics;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetCourseDesktopLicenses;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetCourseDesktopWatermarkPolicy;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopWatermarkForPlayback;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetTeacherStudentSatisfaction;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.ListDesktopLicenseDevices;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopAccessBlocks;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopAccessStatus;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopCourseCurriculum;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopDeviceRegistrations;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopEncryptedMedia;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopLicensedCourses;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopPlaybackPackage;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetStudentDesktopLicenses;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.ValidateDesktopLicense;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
public class DesktopDrmController : BaseController
{
    [HttpGet("MyEncryptedMedia")]
    public async Task<IActionResult> MyEncryptedMedia([FromQuery] string? deviceId)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();
        return await Query<GetDesktopEncryptedMediaQuery, List<DesktopEncryptedMediaQri>>(
            new GetDesktopEncryptedMediaQuery { UserId = userId, DeviceId = deviceId });
    }

    [HttpPost("RegisterDevice")]
    public async Task<IActionResult> RegisterDevice([FromBody] RegisterDeviceBody body)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();

        return await Create<RegisterDesktopDeviceCommand, DesktopAccessStatusQri>(
            new RegisterDesktopDeviceCommand
            {
                UserId = userId,
                DeviceId = body.DeviceId ?? string.Empty,
                MachineName = body.MachineName,
                OsVersion = body.OsVersion,
                AppVersion = body.AppVersion,
            });
    }

    [HttpPost("LogoutSession")]
    public async Task<IActionResult> LogoutSession([FromBody] LogoutSessionBody body)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();

        return await Edit<LogoutDesktopSessionCommand, string>(
            new LogoutDesktopSessionCommand
            {
                UserId = userId,
                DeviceId = body.DeviceId ?? string.Empty,
            });
    }

    [HttpGet("AccessStatus")]
    public async Task<IActionResult> AccessStatus([FromQuery] string? deviceId, [FromQuery] bool checkVideoPlayback = false)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();

        return await Query<GetDesktopAccessStatusQuery, DesktopAccessStatusQri>(
            new GetDesktopAccessStatusQuery
            {
                UserId = userId,
                DeviceId = deviceId ?? string.Empty,
                CheckVideoPlayback = checkVideoPlayback,
            });
    }

    [HttpGet("GetDeviceRegistrations")]
    public async Task<IActionResult> GetDeviceRegistrations([FromQuery] GetDesktopDeviceRegistrationsQuery query)
        => await Query<GetDesktopDeviceRegistrationsQuery, List<DesktopDeviceRegistrationAdminQri>>(query);

    [HttpGet("GetAccessBlocks")]
    public async Task<IActionResult> GetAccessBlocks([FromQuery] GetDesktopAccessBlocksQuery query)
        => await Query<GetDesktopAccessBlocksQuery, List<DesktopAccessBlockAdminQri>>(query);

    [HttpPost("BlockDevice")]
    public async Task<IActionResult> BlockDevice([FromBody] BlockDesktopDeviceCommand command)
        => await Edit<BlockDesktopDeviceCommand, string>(command);

    [HttpPost("UnblockDevice")]
    public async Task<IActionResult> UnblockDevice([FromBody] UnblockDesktopDeviceCommand command)
        => await Edit<UnblockDesktopDeviceCommand, string>(command);

    [HttpPost("BlockUserAccess")]
    public async Task<IActionResult> BlockUserAccess([FromBody] BlockDesktopUserAccessCommand command)
        => await Create<BlockDesktopUserAccessCommand, string>(command);

    [HttpPost("UnblockUserAccess")]
    public async Task<IActionResult> UnblockUserAccess([FromBody] UnblockDesktopUserAccessCommand command)
        => await Edit<UnblockDesktopUserAccessCommand, string>(command);

    [HttpPost("RequestOfflineGrant")]
    public async Task<IActionResult> RequestOfflineGrant([FromBody] RequestOfflineGrantBody body)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();
        if (body.CourseId <= 0) return BadRequest("CourseId is required.");

        return await Create<RequestOfflinePlaybackGrantCommand, OfflinePlaybackGrantQri>(
            new RequestOfflinePlaybackGrantCommand
            {
                UserId = userId,
                CourseId = body.CourseId,
                DeviceId = body.DeviceId,
                OsVersion = body.OsVersion,
                MachineName = body.MachineName,
            });
    }

    [HttpPost("ValidateDesktopLicense")]
    public async Task<IActionResult> ValidateDesktopLicense([FromBody] ValidateLicenseBody body)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();

        return await Query<ValidateDesktopLicenseQuery, DesktopLicenseValidationQri?>(
            new ValidateDesktopLicenseQuery
            {
                UserId = userId,
                LicenseKey = body.LicenseKey ?? string.Empty,
                DeviceId = body.DeviceId,
                OsVersion = body.OsVersion,
                MachineName = body.MachineName,
            });
    }

    [HttpGet("StudentDesktopLicenses")]
    public async Task<IActionResult> StudentDesktopLicenses([FromQuery] long userId, [FromQuery] long studentId = 0)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();
        if (userId <= 0 && studentId <= 0) return BadRequest("userId or studentId is required.");

        return await Query<GetStudentDesktopLicensesQuery, List<StudentDesktopLicenseQri>>(
            new GetStudentDesktopLicensesQuery
            {
                RequestingUserId = requestingUserId,
                TargetUserId = userId,
                StudentId = studentId,
            });
    }

    [HttpPost("RequestDesktopLicense")]
    public Task<IActionResult> RequestDesktopLicense([FromBody] RequestDesktopLicenseCommand command)
        => Create<RequestDesktopLicenseCommand, string>(command);

    [HttpPost("CreateStudentDesktopLicense")]
    public async Task<IActionResult> CreateStudentDesktopLicense([FromBody] CreateStudentDesktopLicenseBody body)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();

        return await Create<CreateStudentDesktopLicenseCommand, StudentDesktopLicenseResultQri>(
            new CreateStudentDesktopLicenseCommand
            {
                RequestingUserId = requestingUserId,
                TargetUserId = body.UserId,
                CourseId = body.CourseId,
                ExpiresAtUtc = body.ExpiresAtUtc,
                ReplaceExisting = body.ReplaceExisting,
            });
    }

    [HttpPost("RevokeStudentDesktopLicense")]
    public async Task<IActionResult> RevokeStudentDesktopLicense([FromBody] RevokeStudentDesktopLicenseBody body)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();

        return await Edit<RevokeStudentDesktopLicenseCommand, StudentDesktopLicenseResultQri>(
            new RevokeStudentDesktopLicenseCommand
            {
                RequestingUserId = requestingUserId,
                EnrollmentId = body.EnrollmentId,
            });
    }

    [HttpPost("RenewStudentDesktopLicense")]
    public async Task<IActionResult> RenewStudentDesktopLicense([FromBody] RenewStudentDesktopLicenseBody body)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();

        return await Edit<RenewStudentDesktopLicenseCommand, StudentDesktopLicenseResultQri>(
            new RenewStudentDesktopLicenseCommand
            {
                RequestingUserId = requestingUserId,
                EnrollmentId = body.EnrollmentId,
                ExpiresAtUtc = body.ExpiresAtUtc,
            });
    }

    [HttpPost("RegenerateStudentDesktopLicense")]
    public async Task<IActionResult> RegenerateStudentDesktopLicense([FromBody] RegenerateStudentDesktopLicenseBody body)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();

        return await Edit<RegenerateStudentDesktopLicenseCommand, StudentDesktopLicenseResultQri>(
            new RegenerateStudentDesktopLicenseCommand
            {
                RequestingUserId = requestingUserId,
                EnrollmentId = body.EnrollmentId,
                ExpiresAtUtc = body.ExpiresAtUtc,
            });
    }

    [HttpPost("DeleteStudentDesktopLicense")]
    public async Task<IActionResult> DeleteStudentDesktopLicense([FromBody] DeleteStudentDesktopLicenseBody body)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();

        return await Edit<DeleteStudentDesktopLicenseCommand, StudentDesktopLicenseResultQri>(
            new DeleteStudentDesktopLicenseCommand
            {
                RequestingUserId = requestingUserId,
                EnrollmentId = body.EnrollmentId,
            });
    }

    [HttpGet("MyLicensedCourses")]
    public async Task<IActionResult> MyLicensedCourses()
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();

        return await Query<GetDesktopLicensedCoursesQuery, List<DesktopLicensedCourseQri>>(
            new GetDesktopLicensedCoursesQuery { UserId = userId });
    }

    [HttpGet("CourseCurriculum")]
    public async Task<IActionResult> CourseCurriculum([FromQuery] long courseId, [FromQuery] string? licenseKey)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();
        if (courseId <= 0) return BadRequest("courseId is required.");

        return await Query<GetDesktopCourseCurriculumQuery, DesktopCourseCurriculumQri?>(
            new GetDesktopCourseCurriculumQuery
            {
                UserId = userId,
                CourseId = courseId,
                LicenseKey = licenseKey,
            });
    }

    [HttpGet("PlaybackPackage")]
    public async Task<IActionResult> PlaybackPackage(
        [FromQuery] long mediaAssetId,
        [FromQuery] string grantToken,
        [FromQuery] long? courseId,
        [FromQuery] string? deviceId)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();
        if (mediaAssetId <= 0)
            return BadRequest("mediaAssetId is required.");

        return await Query<GetDesktopPlaybackPackageQuery, DesktopPlaybackPackageQri>(
            new GetDesktopPlaybackPackageQuery
            {
                UserId = userId,
                MediaAssetId = mediaAssetId,
                GrantToken = grantToken ?? string.Empty,
                CourseId = courseId,
                DeviceId = deviceId,
            });
    }

    /// <summary>
    /// Streams encrypted lesson bytes after the same grant checks as PlaybackPackage.
    /// Prefer this over anonymous StaticFiles /media/... URLs.
    /// </summary>
    [HttpGet("DownloadEncrypted")]
    public async Task<IActionResult> DownloadEncrypted(
        [FromQuery] long mediaAssetId,
        [FromQuery] string grantToken,
        [FromQuery] string? deviceId,
        [FromServices] IWebHostEnvironment env,
        [FromServices] IDesktopDrmQueryRepository desktopDrmQueryRepository,
        [FromServices] ArkaSoftwarePro.Src.Core.Contracts.FileStorage.IFileStorage fileStorage)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();
        if (mediaAssetId <= 0) return BadRequest("mediaAssetId is required.");

        var package = await desktopDrmQueryRepository.GetPlaybackPackageAsync(
            userId,
            mediaAssetId,
            grantToken ?? string.Empty,
            deviceId);

        if (package is null || string.IsNullOrWhiteSpace(package.EncryptedFileUrl))
            return NotFound();

        var keyOrUrl = package.EncryptedFileUrl.Replace('\\', '/').Trim();
        string objectKey;
        if (keyOrUrl.StartsWith("drm/", StringComparison.OrdinalIgnoreCase)
            || keyOrUrl.StartsWith("private/", StringComparison.OrdinalIgnoreCase)
            || keyOrUrl.StartsWith("public/", StringComparison.OrdinalIgnoreCase))
        {
            objectKey = keyOrUrl.TrimStart('/');
        }
        else
        {
            objectKey = fileStorage.ToObjectKey(keyOrUrl, ArkaSoftwarePro.Src.Core.Contracts.FileStorage.FileAccessTier.Drm);
        }

        // Prefer signed redirect to msg host (fast path).
        if (await fileStorage.ExistsAsync(objectKey))
        {
            var signed = fileStorage.CreateSignedReadUrl(objectKey);
            if (signed.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                return Redirect(signed);
        }

        // Legacy local wwwroot fallback
        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var relative = keyOrUrl;
        if (relative.StartsWith("http", StringComparison.OrdinalIgnoreCase) &&
            Uri.TryCreate(relative, UriKind.Absolute, out var absolute))
        {
            relative = absolute.AbsolutePath;
        }

        var mediaIdx = relative.IndexOf("/media/", StringComparison.OrdinalIgnoreCase);
        if (mediaIdx >= 0)
            relative = relative[mediaIdx..];
        if (!relative.StartsWith('/'))
            relative = "/" + relative;

        var physical = Path.GetFullPath(Path.Combine(webRoot, relative.TrimStart('/').Replace('/', Path.DirectorySeparatorChar)));
        var webRootFull = Path.GetFullPath(webRoot);
        if (!physical.StartsWith(webRootFull, StringComparison.OrdinalIgnoreCase) || !System.IO.File.Exists(physical))
            return NotFound();

        return PhysicalFile(physical, "application/octet-stream", enableRangeProcessing: true);
    }

    [HttpGet("WatermarkPolicy")]
    public async Task<IActionResult> WatermarkPolicy([FromQuery] long courseId)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();
        if (courseId <= 0) return BadRequest("courseId is required.");

        return await Query<GetCourseDesktopWatermarkPolicyQuery, CourseDesktopWatermarkPolicyQri?>(
            new GetCourseDesktopWatermarkPolicyQuery
            {
                RequestingUserId = requestingUserId,
                CourseId = courseId,
            });
    }

    [HttpPost("WatermarkPolicy")]
    public async Task<IActionResult> UpdateWatermarkPolicy([FromBody] UpdateCourseDesktopWatermarkPolicyCommand body)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();

        body.RequestingUserId = requestingUserId;
        return await Edit<UpdateCourseDesktopWatermarkPolicyCommand, CourseDesktopWatermarkPolicyResultQri>(body);
    }

    [HttpGet("CourseLicenses")]
    public async Task<IActionResult> CourseLicenses([FromQuery] long courseId)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();
        if (courseId <= 0) return BadRequest("courseId is required.");

        return await Query<GetCourseDesktopLicensesQuery, List<CourseDesktopLicenseEnrollmentQri>>(
            new GetCourseDesktopLicensesQuery
            {
                RequestingUserId = requestingUserId,
                CourseId = courseId,
            });
    }

    [HttpPost("LicenseLimits")]
    public async Task<IActionResult> LicenseLimits([FromBody] UpdateDesktopLicenseLimitsCommand body)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();

        body.RequestingUserId = requestingUserId;
        return await Edit<UpdateDesktopLicenseLimitsCommand, DesktopLicenseLimitsResultQri>(body);
    }

    [HttpPost("LicenseLessonAccess")]
    public async Task<IActionResult> LicenseLessonAccess([FromBody] SetDesktopLicenseLessonAccessCommand body)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();

        body.RequestingUserId = requestingUserId;
        return await Edit<SetDesktopLicenseLessonAccessCommand, DesktopLicenseLessonAccessResultQri>(body);
    }

    [HttpGet("LicenseDevices")]
    public async Task<IActionResult> LicenseDevices([FromQuery] long enrollmentId)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();
        if (enrollmentId <= 0) return BadRequest("enrollmentId is required.");

        return await Query<ListDesktopLicenseDevicesQuery, List<DesktopLicenseDeviceBindingQri>>(
            new ListDesktopLicenseDevicesQuery
            {
                RequestingUserId = requestingUserId,
                EnrollmentId = enrollmentId,
            });
    }

    [HttpPost("RevokeLicenseDevice")]
    public async Task<IActionResult> RevokeLicenseDevice([FromBody] RevokeDesktopLicenseDeviceCommand body)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();

        body.RequestingUserId = requestingUserId;
        return await Edit<RevokeDesktopLicenseDeviceCommand, DesktopLicenseDeviceRevokeResultQri>(body);
    }

    [HttpPost("ResetLicenseDevices")]
    public async Task<IActionResult> ResetLicenseDevices([FromBody] ResetDesktopLicenseDevicesCommand body)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();

        body.RequestingUserId = requestingUserId;
        return await Edit<ResetDesktopLicenseDevicesCommand, ResetDesktopLicenseDevicesResultQri>(body);
    }

    [HttpPost("ReportPlaybackTelemetry")]
    public async Task<IActionResult> ReportPlaybackTelemetry([FromBody] ReportDesktopPlaybackTelemetryCommand body)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();

        body.UserId = userId;
        return await Create<ReportDesktopPlaybackTelemetryCommand, string>(body);
    }

    [HttpGet("CourseAnalytics")]
    public async Task<IActionResult> CourseAnalytics([FromQuery] long courseId)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();
        if (courseId <= 0) return BadRequest("courseId is required.");

        return await Query<GetCourseDesktopAnalyticsQuery, CourseDesktopAnalyticsQri>(
            new GetCourseDesktopAnalyticsQuery
            {
                RequestingUserId = requestingUserId,
                CourseId = courseId,
            });
    }

    [HttpPost("TeacherStudentSatisfaction")]
    public async Task<IActionResult> UpsertTeacherStudentSatisfaction([FromBody] UpsertTeacherStudentSatisfactionCommand body)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();

        body.RequestingUserId = requestingUserId;
        return await Edit<UpsertTeacherStudentSatisfactionCommand, TeacherStudentSatisfactionQri>(body);
    }

    [HttpGet("TeacherStudentSatisfaction")]
    public async Task<IActionResult> GetTeacherStudentSatisfaction(
        [FromQuery] long courseId = 0,
        [FromQuery] long enrollmentId = 0)
    {
        var requestingUserId = GetCurrentUserId();
        if (requestingUserId <= 0) return Unauthorized();
        if (courseId <= 0 && enrollmentId <= 0)
            return BadRequest("courseId or enrollmentId is required.");

        return await Query<GetTeacherStudentSatisfactionQuery, List<TeacherStudentSatisfactionItemQri>>(
            new GetTeacherStudentSatisfactionQuery
            {
                RequestingUserId = requestingUserId,
                CourseId = courseId,
                EnrollmentId = enrollmentId,
            });
    }

    [HttpGet("WatermarkForPlayback")]
    public async Task<IActionResult> WatermarkForPlayback([FromQuery] long courseId)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();
        if (courseId <= 0) return BadRequest("courseId is required.");

        return await Query<GetDesktopWatermarkForPlaybackQuery, DesktopWatermarkForPlaybackQri?>(
            new GetDesktopWatermarkForPlaybackQuery
            {
                UserId = userId,
                CourseId = courseId,
            });
    }

    private long GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("userId")?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("UserId")?.Value;
        return long.TryParse(claim, out var id) ? id : 0;
    }

    public sealed class RequestOfflineGrantBody
    {
        public long CourseId { get; set; }
        public string? DeviceId { get; set; }
        public string? OsVersion { get; set; }
        public string? MachineName { get; set; }
    }

    public sealed class RegisterDeviceBody
    {
        public string? DeviceId { get; set; }
        public string? MachineName { get; set; }
        public string? OsVersion { get; set; }
        public string? AppVersion { get; set; }
    }

    public sealed class LogoutSessionBody
    {
        public string? DeviceId { get; set; }
    }

    public sealed class ValidateLicenseBody
    {
        public string? LicenseKey { get; set; }
        public string? DeviceId { get; set; }
        public string? OsVersion { get; set; }
        public string? MachineName { get; set; }
    }

    public sealed class CreateStudentDesktopLicenseBody
    {
        public long UserId { get; set; }
        public long CourseId { get; set; }
        public DateTime? ExpiresAtUtc { get; set; }
        public bool ReplaceExisting { get; set; }
    }

    public sealed class RevokeStudentDesktopLicenseBody
    {
        public long EnrollmentId { get; set; }
    }

    public sealed class RenewStudentDesktopLicenseBody
    {
        public long EnrollmentId { get; set; }
        public DateTime? ExpiresAtUtc { get; set; }
    }

    public sealed class RegenerateStudentDesktopLicenseBody
    {
        public long EnrollmentId { get; set; }
        public DateTime? ExpiresAtUtc { get; set; }
    }

    public sealed class DeleteStudentDesktopLicenseBody
    {
        public long EnrollmentId { get; set; }
    }
}
