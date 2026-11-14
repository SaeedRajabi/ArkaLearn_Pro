using ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.ReportDesktopPlaybackTelemetry;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.ResetDesktopLicenseDevices;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RevokeDesktopLicenseDevice;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.SetDesktopLicenseLessonAccess;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.UpdateCourseDesktopWatermarkPolicy;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.UpdateDesktopLicenseLimits;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.UpsertTeacherStudentSatisfaction;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Commands;

public sealed class UpdateCourseDesktopWatermarkPolicyCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IDesktopDrmCommandRepository drmRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UpdateCourseDesktopWatermarkPolicyCommand, CourseDesktopWatermarkPolicyResultQri>(outer)
{
    public override async Task<CommandResult<CourseDesktopWatermarkPolicyResultQri>> Handle(UpdateCourseDesktopWatermarkPolicyCommand command)
    {
        if (command.RequestingUserId <= 0 || command.CourseId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var course = await courseCommandRepository.GetAsync(command.CourseId);
        if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (!await DesktopDrmCourseAuthorization.CanManageCourseAsync(
                command.RequestingUserId, course.TeacherId, teacherQueryRepository, httpContextAccessor, AddMessage))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var policy = await drmRepository.GetWatermarkPolicyByCourseIdAsync(command.CourseId);
        if (policy is null)
        {
            policy = CourseDesktopWatermarkPolicy.CreateDefault(command.CourseId);
            await drmRepository.InsertWatermarkPolicyAsync(policy);
        }

        policy.Update(
            command.TextTemplate,
            command.FontSize,
            command.FontColor,
            command.Opacity,
            command.Position,
            command.RotationDeg,
            command.Movement,
            command.PaddingPx);

        await drmRepository.CommitAsync();

        return await ResultAsync(new CourseDesktopWatermarkPolicyResultQri
        {
            CourseId = policy.CourseId,
            TextTemplate = policy.TextTemplate,
            FontSize = policy.FontSize,
            FontColor = policy.FontColor,
            Opacity = policy.Opacity,
            Position = policy.Position,
            RotationDeg = policy.RotationDeg,
            Movement = policy.Movement,
            PaddingPx = policy.PaddingPx,
            PlatformLogoLocked = true,
            UpdatedAtUtc = policy.UpdatedAtUtc,
        }, ApplicationServiceStatus.Ok);
    }
}

public sealed class UpdateDesktopLicenseLimitsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UpdateDesktopLicenseLimitsCommand, DesktopLicenseLimitsResultQri>(outer)
{
    public override async Task<CommandResult<DesktopLicenseLimitsResultQri>> Handle(UpdateDesktopLicenseLimitsCommand command)
    {
        if (command.RequestingUserId <= 0 || command.EnrollmentId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var enrollment = await enrollmentCommandRepository.GetByIdForEditAsync(command.EnrollmentId);
        if (enrollment is null || !enrollment.CourseId.HasValue)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var course = await courseCommandRepository.GetAsync(enrollment.CourseId.Value);
        if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (!await DesktopDrmCourseAuthorization.CanManageCourseAsync(
                command.RequestingUserId, course.TeacherId, teacherQueryRepository, httpContextAccessor, AddMessage))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        enrollment.ConfigureDesktopLicenseLimits(command.MaxDevices, command.AllowedOs);
        await enrollmentCommandRepository.CommitAsync();

        return await ResultAsync(new DesktopLicenseLimitsResultQri
        {
            EnrollmentId = enrollment.Id,
            MaxDevices = enrollment.DesktopLicenseMaxDevices,
            AllowedOs = enrollment.DesktopLicenseAllowedOs,
        }, ApplicationServiceStatus.Ok);
    }
}

public sealed class SetDesktopLicenseLessonAccessCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    IDesktopDrmCommandRepository drmRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<SetDesktopLicenseLessonAccessCommand, DesktopLicenseLessonAccessResultQri>(outer)
{
    public override async Task<CommandResult<DesktopLicenseLessonAccessResultQri>> Handle(SetDesktopLicenseLessonAccessCommand command)
    {
        if (command.RequestingUserId <= 0 || command.EnrollmentId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var enrollment = await enrollmentCommandRepository.GetByIdForEditAsync(command.EnrollmentId);
        if (enrollment is null || !enrollment.CourseId.HasValue)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var course = await courseCommandRepository.GetAsync(enrollment.CourseId.Value);
        if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (!await DesktopDrmCourseAuthorization.CanManageCourseAsync(
                command.RequestingUserId, course.TeacherId, teacherQueryRepository, httpContextAccessor, AddMessage))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var lessonIds = command.LessonIds?.Where(id => id > 0).Distinct().ToArray() ?? [];
        enrollment.ConfigureDesktopContentAccess(
            lessonIds.Length > 0 ? DesktopContentAccessMode.Partial : DesktopContentAccessMode.Full);

        await drmRepository.ReplaceLessonAccessAsync(enrollment.Id, lessonIds);
        await drmRepository.CommitAsync();
        await enrollmentCommandRepository.CommitAsync();

        return await ResultAsync(new DesktopLicenseLessonAccessResultQri
        {
            EnrollmentId = enrollment.Id,
            AllowedLessonIds = lessonIds,
        }, ApplicationServiceStatus.Ok);
    }
}

public sealed class RevokeDesktopLicenseDeviceCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    IDesktopDrmCommandRepository drmRepository,
    IStudentQueryRepository studentQueryRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<RevokeDesktopLicenseDeviceCommand, DesktopLicenseDeviceRevokeResultQri>(outer)
{
    public override async Task<CommandResult<DesktopLicenseDeviceRevokeResultQri>> Handle(RevokeDesktopLicenseDeviceCommand command)
    {
        if (command.RequestingUserId <= 0 || command.EnrollmentId <= 0 || string.IsNullOrWhiteSpace(command.DeviceId))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var enrollment = await enrollmentCommandRepository.GetByIdForEditAsync(command.EnrollmentId);
        if (enrollment is null || !enrollment.CourseId.HasValue)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var course = await courseCommandRepository.GetAsync(enrollment.CourseId.Value);
        if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (!await DesktopDrmCourseAuthorization.CanManageCourseAsync(
                command.RequestingUserId, course.TeacherId, teacherQueryRepository, httpContextAccessor, AddMessage))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var binding = await drmRepository.GetActiveDeviceBindingAsync(command.EnrollmentId, command.DeviceId);
        if (binding is null)
        {
            AddMessage("Active device binding not found.");
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
        }

        binding.Revoke(command.Reason);

        var remaining = await drmRepository.CountActiveDeviceBindingsAsync(enrollment.Id);
        // Binding just revoked is still counted until SaveChanges — adjust.
        var remainingAfter = Math.Max(0, remaining - 1);
        if (remainingAfter == 0)
        {
            enrollment.ClearDesktopLicenseDeviceBinding();

            long? studentUserId = null;
            if (enrollment.StudentId is > 0)
                studentUserId = await studentQueryRepository.GetUserIdByStudentIdAsync(enrollment.StudentId.Value);

            if (studentUserId is > 0)
            {
                var grant = await drmRepository.GetActiveGrantAsync(studentUserId.Value, enrollment.CourseId.Value);
                if (grant is not null && grant.IsValid(DateTime.UtcNow))
                    grant.Revoke();

                var appLicense = await drmRepository.GetActiveLicenseAsync(studentUserId.Value);
                appLicense?.ClearDeviceFingerprint();
            }
        }

        await drmRepository.CommitAsync();
        await enrollmentCommandRepository.CommitAsync();

        return await ResultAsync(new DesktopLicenseDeviceRevokeResultQri
        {
            EnrollmentId = command.EnrollmentId,
            DeviceId = command.DeviceId.Trim(),
            Revoked = true,
        }, ApplicationServiceStatus.Ok);
    }
}

public sealed class ResetDesktopLicenseDevicesCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    IDesktopDrmCommandRepository drmRepository,
    IStudentQueryRepository studentQueryRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<ResetDesktopLicenseDevicesCommand, ResetDesktopLicenseDevicesResultQri>(outer)
{
    public override async Task<CommandResult<ResetDesktopLicenseDevicesResultQri>> Handle(ResetDesktopLicenseDevicesCommand command)
    {
        if (command.RequestingUserId <= 0 || command.EnrollmentId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var enrollment = await enrollmentCommandRepository.GetByIdForEditAsync(command.EnrollmentId);
        if (enrollment is null || !enrollment.CourseId.HasValue)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var course = await courseCommandRepository.GetAsync(enrollment.CourseId.Value);
        if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (!await DesktopDrmCourseAuthorization.CanManageCourseAsync(
                command.RequestingUserId, course.TeacherId, teacherQueryRepository, httpContextAccessor, AddMessage))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var before = await drmRepository.CountActiveDeviceBindingsAsync(enrollment.Id);

        long? studentUserId = null;
        if (enrollment.StudentId is > 0)
            studentUserId = await studentQueryRepository.GetUserIdByStudentIdAsync(enrollment.StudentId.Value);

        await DesktopLicenseDeviceResetHelper.ResetAsync(
            enrollment,
            enrollment.CourseId.Value,
            studentUserId,
            drmRepository,
            command.Reason ?? "All devices reset by teacher/admin");

        await drmRepository.CommitAsync();
        await enrollmentCommandRepository.CommitAsync();

        return await ResultAsync(new ResetDesktopLicenseDevicesResultQri
        {
            EnrollmentId = enrollment.Id,
            RevokedDeviceCount = before,
            Cleared = true,
        }, ApplicationServiceStatus.Ok);
    }
}

public sealed class ReportDesktopPlaybackTelemetryCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmCommandRepository drmRepository,
    IDesktopDrmQueryRepository drmQueryRepository)
    : CommandHandler<ReportDesktopPlaybackTelemetryCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ReportDesktopPlaybackTelemetryCommand command)
    {
        if (command.UserId <= 0 || command.CourseId <= 0 || command.LessonId <= 0)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        var enrolled = await drmQueryRepository.IsUserEnrolledInCourseAsync(command.UserId, command.CourseId);
        if (!enrolled)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        var evt = DesktopPlaybackEvent.Create(
            command.UserId,
            command.CourseId,
            command.LessonId,
            command.EnrollmentId,
            command.DeviceId,
            command.Kind,
            command.PositionSeconds,
            command.WatchedDeltaSeconds);

        await drmRepository.InsertPlaybackEventAsync(evt);
        await drmRepository.CommitAsync();

        return await OkAsync("ok");
    }
}

public sealed class UpsertTeacherStudentSatisfactionCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    IDesktopDrmCommandRepository drmRepository,
    IStudentQueryRepository studentQueryRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UpsertTeacherStudentSatisfactionCommand, TeacherStudentSatisfactionQri>(outer)
{
    public override async Task<CommandResult<TeacherStudentSatisfactionQri>> Handle(UpsertTeacherStudentSatisfactionCommand command)
    {
        if (command.RequestingUserId <= 0 || command.EnrollmentId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        if (command.Score is < 1 or > 5)
        {
            AddMessage("Score must be between 1 and 5.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }

        var enrollment = await enrollmentCommandRepository.GetByIdForEditAsync(command.EnrollmentId);
        if (enrollment is null || !enrollment.CourseId.HasValue || !enrollment.StudentId.HasValue)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var course = await courseCommandRepository.GetAsync(enrollment.CourseId.Value);
        if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (!await DesktopDrmCourseAuthorization.CanManageCourseAsync(
                command.RequestingUserId, course.TeacherId, teacherQueryRepository, httpContextAccessor, AddMessage))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var studentUserId = await studentQueryRepository.GetUserIdByStudentIdAsync(enrollment.StudentId.Value);
        if (!studentUserId.HasValue)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var existing = await drmRepository.GetTeacherStudentSatisfactionAsync(command.EnrollmentId, command.RequestingUserId);
        if (existing is null)
        {
            existing = TeacherStudentSatisfaction.Create(
                enrollment.CourseId.Value,
                enrollment.Id,
                command.RequestingUserId,
                studentUserId.Value,
                command.Score,
                command.Note);
            await drmRepository.InsertTeacherStudentSatisfactionAsync(existing);
        }
        else
        {
            existing.Update(command.Score, command.Note);
        }

        await drmRepository.CommitAsync();

        return await ResultAsync(new TeacherStudentSatisfactionQri
        {
            Id = existing.Id,
            CourseId = existing.CourseId,
            EnrollmentId = existing.EnrollmentId,
            TeacherUserId = existing.TeacherUserId,
            StudentUserId = existing.StudentUserId,
            Score = existing.Score,
            Note = existing.Note,
            UpdatedAtUtc = existing.UpdatedAtUtc,
        }, ApplicationServiceStatus.Ok);
    }
}
