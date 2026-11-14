using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Services;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.ManageStudentDesktopLicense;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using CourseEnrollmentNotifier = ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.CourseEnrollmentNotifier;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Commands;

public sealed class CreateStudentDesktopLicenseCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IStudentQueryRepository studentQueryRepository,
    IStudentCommandRepository studentCommandRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    IDesktopDrmCommandRepository drmRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IUserQueryRepository userQueryRepository,
    CourseEnrollmentNotifier enrollmentNotifier,
    ITransactionalEmailNotifier transactionalEmailNotifier,
    IConfiguration configuration,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<CreateStudentDesktopLicenseCommand, StudentDesktopLicenseResultQri>(outer)
{
    public override async Task<CommandResult<StudentDesktopLicenseResultQri>> Handle(CreateStudentDesktopLicenseCommand command)
    {
        if (command.RequestingUserId <= 0 || command.TargetUserId <= 0 || command.CourseId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var course = await courseCommandRepository.GetAsync(command.CourseId);
        if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
        {
            AddMessage("Course is not a desktop-license course.");
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
        }

        if (!await CanManageCourseAsync(command.RequestingUserId, course.TeacherId))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var targetUser = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = command.TargetUserId });
        if (targetUser is null)
        {
            AddMessage("Student user was not found. Ensure the correct user id is sent as a string.");
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
        }

        var studentId = await studentQueryRepository.GetStudentIdByUserIdAsync(command.TargetUserId);
        if (!studentId.HasValue)
        {
            var student = new Student(command.TargetUserId);
            await studentCommandRepository.InsertAsync(student);
            await studentCommandRepository.CommitAsync();
            studentId = await studentQueryRepository.GetStudentIdByUserIdAsync(command.TargetUserId);
        }

        if (!studentId.HasValue)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var enrollment = await enrollmentCommandRepository.GetByStudentAndCourseAsync(studentId.Value, command.CourseId);
        if (enrollment is null)
        {
            enrollment = new Enrollment(studentId.Value, command.CourseId, isActive: true);
            await enrollmentCommandRepository.InsertAsync(enrollment);
        }
        else if (!string.IsNullOrWhiteSpace(enrollment.DesktopLicenseKey) && !command.ReplaceExisting)
        {
            AddMessage(
                "This student already has a desktop license for this course. " +
                "Each student may have only one license per course. Use replace/reissue to invalidate the old key.");
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);
        }
        else if (!string.IsNullOrWhiteSpace(enrollment.DesktopLicenseKey) && command.ReplaceExisting)
        {
            await DesktopLicenseDeviceResetHelper.ResetAsync(
                enrollment,
                command.CourseId,
                command.TargetUserId,
                drmRepository,
                "License reissued — previous devices cleared");
            await drmRepository.CommitAsync();
        }

        enrollment.AssignDesktopLicense(DesktopLicenseGenerator.Generate(), command.ExpiresAtUtc);
        await enrollmentCommandRepository.CommitAsync();

        if (enrollment.Id <= 0)
        {
            enrollment = await enrollmentCommandRepository.GetByStudentAndCourseAsync(studentId.Value, command.CourseId)
                ?? enrollment;
        }

        var courseTitle = course.Title?.Value ?? string.Empty;
        var licenseKey = enrollment.DesktopLicenseKey ?? string.Empty;
        var accessLabel = enrollment.DesktopContentAccessMode == DesktopContentAccessMode.Partial
            ? "دسترسی جزئی به دروس"
            : "دسترسی کامل";
        var durationLabel = enrollment.DesktopLicenseExpiresAtUtc.HasValue
            ? $"تا {enrollment.DesktopLicenseExpiresAtUtc.Value.ToLocalTime():yyyy/MM/dd}"
            : "یک سال / طبق تنظیم استاد";

        try
        {
            await enrollmentNotifier.NotifyLicenseApprovedAsync(
                course,
                command.TargetUserId,
                licenseKey,
                accessLabel,
                enrollment.DesktopLicenseExpiresAtUtc);
        }
        catch
        {
            // License was issued; notification failure must not roll back.
        }

        try
        {
            if (!string.IsNullOrWhiteSpace(targetUser.Email))
            {
                var teacherName = "استاد";
                var teacherUserId = course.TeacherId is > 0
                    ? await teacherQueryRepository.GetUserIdByTeacherIdAsync(course.TeacherId.Value)
                    : null;
                if (teacherUserId is > 0)
                {
                    var teacherUser = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = teacherUserId.Value });
                    if (!string.IsNullOrWhiteSpace(teacherUser?.FullName))
                        teacherName = teacherUser!.FullName!;
                    else if (!string.IsNullOrWhiteSpace(teacherUser?.UserName))
                        teacherName = teacherUser!.UserName!;
                }

                var downloadUrl = ResolveDesktopDownloadUrl();
                var studentName = string.IsNullOrWhiteSpace(targetUser.FullName)
                    ? targetUser.UserName ?? "دانشجو"
                    : targetUser.FullName!;

                await transactionalEmailNotifier.SendStudentDesktopLicenseIssuedAsync(
                    targetUser.Email!,
                    studentName,
                    courseTitle,
                    teacherName,
                    licenseKey,
                    accessLabel,
                    durationLabel,
                    downloadUrl,
                    "/account?view=my-courses");
            }
        }
        catch
        {
            // License was issued; email failure must not roll back.
        }

        return await ResultAsync(Map(enrollment, courseTitle), ApplicationServiceStatus.Ok);
    }

    private string ResolveDesktopDownloadUrl()
    {
        var configured = configuration["DesktopApp:DownloadPageUrl"]
            ?? configuration["PaymentGateway:ClientBaseUrl"];
        var baseUrl = (configured ?? "https://arkasoftware.ir").Trim().TrimEnd('/');
        return $"{baseUrl}/account/desktop-app";
    }

    private async Task<bool> CanManageCourseAsync(long requestingUserId, long? courseTeacherId)
    {
        if (DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return true;

        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(requestingUserId);
        if (!teacherId.HasValue || courseTeacherId != teacherId.Value)
        {
            AddMessage("Access denied.");
            return false;
        }

        return true;
    }

    private static StudentDesktopLicenseResultQri Map(Enrollment enrollment, string courseTitle)
    {
        var utcNow = DateTime.UtcNow;
        return new StudentDesktopLicenseResultQri
        {
            EnrollmentId = enrollment.Id,
            CourseId = enrollment.CourseId ?? 0,
            CourseTitle = courseTitle,
            DesktopLicenseKey = enrollment.DesktopLicenseKey,
            IsDesktopLicenseActive = enrollment.IsDesktopLicenseActive,
            DesktopLicenseExpiresAtUtc = enrollment.DesktopLicenseExpiresAtUtc,
            IsCurrentlyValid = enrollment.IsDesktopLicenseCurrentlyValid(utcNow),
        };
    }
}

public sealed class RevokeStudentDesktopLicenseCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    IDesktopDrmCommandRepository drmRepository,
    IStudentQueryRepository studentQueryRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<RevokeStudentDesktopLicenseCommand, StudentDesktopLicenseResultQri>(outer)
{
    public override async Task<CommandResult<StudentDesktopLicenseResultQri>> Handle(RevokeStudentDesktopLicenseCommand command)
    {
        if (command.RequestingUserId <= 0 || command.EnrollmentId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var enrollment = await enrollmentCommandRepository.GetByIdForEditAsync(command.EnrollmentId);
        if (enrollment is null || !enrollment.CourseId.HasValue)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var course = await courseCommandRepository.GetAsync(enrollment.CourseId.Value);
        if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (!await CanManageCourseAsync(command.RequestingUserId, course.TeacherId))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        long? studentUserId = null;
        if (enrollment.StudentId is > 0)
            studentUserId = await studentQueryRepository.GetUserIdByStudentIdAsync(enrollment.StudentId.Value);

        // Free device slots + invalidate offline tokens, then deactivate the license key.
        await DesktopLicenseDeviceResetHelper.ResetAsync(
            enrollment,
            enrollment.CourseId.Value,
            studentUserId,
            drmRepository,
            "License revoked by teacher/admin");

        enrollment.RevokeDesktopLicense();
        await drmRepository.CommitAsync();
        await enrollmentCommandRepository.CommitAsync();

        return await ResultAsync(Map(enrollment, course.Title?.Value ?? string.Empty), ApplicationServiceStatus.Ok);
    }

    private async Task<bool> CanManageCourseAsync(long requestingUserId, long? courseTeacherId)
    {
        if (DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return true;

        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(requestingUserId);
        if (!teacherId.HasValue || courseTeacherId != teacherId.Value)
        {
            AddMessage("Access denied.");
            return false;
        }

        return true;
    }

    private static StudentDesktopLicenseResultQri Map(Enrollment enrollment, string courseTitle) =>
        new()
        {
            EnrollmentId = enrollment.Id,
            CourseId = enrollment.CourseId ?? 0,
            CourseTitle = courseTitle,
            DesktopLicenseKey = enrollment.DesktopLicenseKey,
            IsDesktopLicenseActive = enrollment.IsDesktopLicenseActive,
            DesktopLicenseExpiresAtUtc = enrollment.DesktopLicenseExpiresAtUtc,
            IsCurrentlyValid = enrollment.IsDesktopLicenseCurrentlyValid(DateTime.UtcNow),
        };
}

public sealed class RenewStudentDesktopLicenseCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<RenewStudentDesktopLicenseCommand, StudentDesktopLicenseResultQri>(outer)
{
    public override async Task<CommandResult<StudentDesktopLicenseResultQri>> Handle(RenewStudentDesktopLicenseCommand command)
    {
        if (command.RequestingUserId <= 0 || command.EnrollmentId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var enrollment = await enrollmentCommandRepository.GetByIdForEditAsync(command.EnrollmentId);
        if (enrollment is null || !enrollment.CourseId.HasValue)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var course = await courseCommandRepository.GetAsync(enrollment.CourseId.Value);
        if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (!await CanManageCourseAsync(command.RequestingUserId, course.TeacherId))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        enrollment.RenewDesktopLicense(command.ExpiresAtUtc);
        await enrollmentCommandRepository.CommitAsync();

        return await ResultAsync(Map(enrollment, course.Title?.Value ?? string.Empty), ApplicationServiceStatus.Ok);
    }

    private async Task<bool> CanManageCourseAsync(long requestingUserId, long? courseTeacherId)
    {
        if (DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return true;

        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(requestingUserId);
        if (!teacherId.HasValue || courseTeacherId != teacherId.Value)
        {
            AddMessage("Access denied.");
            return false;
        }

        return true;
    }

    private static StudentDesktopLicenseResultQri Map(Enrollment enrollment, string courseTitle) =>
        new()
        {
            EnrollmentId = enrollment.Id,
            CourseId = enrollment.CourseId ?? 0,
            CourseTitle = courseTitle,
            DesktopLicenseKey = enrollment.DesktopLicenseKey,
            IsDesktopLicenseActive = enrollment.IsDesktopLicenseActive,
            DesktopLicenseExpiresAtUtc = enrollment.DesktopLicenseExpiresAtUtc,
            IsCurrentlyValid = enrollment.IsDesktopLicenseCurrentlyValid(DateTime.UtcNow),
        };
}

public sealed class RegenerateStudentDesktopLicenseCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    IDesktopDrmCommandRepository drmRepository,
    IStudentQueryRepository studentQueryRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<RegenerateStudentDesktopLicenseCommand, StudentDesktopLicenseResultQri>(outer)
{
    public override async Task<CommandResult<StudentDesktopLicenseResultQri>> Handle(RegenerateStudentDesktopLicenseCommand command)
    {
        if (command.RequestingUserId <= 0 || command.EnrollmentId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var enrollment = await enrollmentCommandRepository.GetByIdForEditAsync(command.EnrollmentId);
        if (enrollment is null || !enrollment.CourseId.HasValue)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var course = await courseCommandRepository.GetAsync(enrollment.CourseId.Value);
        if (course is null || !DesktopDrmCourseAuthorization.IsArkaDesktopDelivery(course.DeliveryMode))
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (!await CanManageCourseAsync(command.RequestingUserId, course.TeacherId))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        long? studentUserId = null;
        if (enrollment.StudentId is > 0)
            studentUserId = await studentQueryRepository.GetUserIdByStudentIdAsync(enrollment.StudentId.Value);

        await DesktopLicenseDeviceResetHelper.ResetAsync(
            enrollment,
            enrollment.CourseId.Value,
            studentUserId,
            drmRepository,
            "License key regenerated — previous devices cleared");

        enrollment.RegenerateDesktopLicenseKey(DesktopLicenseGenerator.Generate(), command.ExpiresAtUtc);
        await drmRepository.CommitAsync();
        await enrollmentCommandRepository.CommitAsync();

        return await ResultAsync(Map(enrollment, course.Title?.Value ?? string.Empty), ApplicationServiceStatus.Ok);
    }

    private async Task<bool> CanManageCourseAsync(long requestingUserId, long? courseTeacherId)
    {
        if (DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return true;

        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(requestingUserId);
        if (!teacherId.HasValue || courseTeacherId != teacherId.Value)
        {
            AddMessage("Access denied.");
            return false;
        }

        return true;
    }

    private static StudentDesktopLicenseResultQri Map(Enrollment enrollment, string courseTitle) =>
        new()
        {
            EnrollmentId = enrollment.Id,
            CourseId = enrollment.CourseId ?? 0,
            CourseTitle = courseTitle,
            DesktopLicenseKey = enrollment.DesktopLicenseKey,
            IsDesktopLicenseActive = enrollment.IsDesktopLicenseActive,
            DesktopLicenseExpiresAtUtc = enrollment.DesktopLicenseExpiresAtUtc,
            IsCurrentlyValid = enrollment.IsDesktopLicenseCurrentlyValid(DateTime.UtcNow),
        };
}

public sealed class DeleteStudentDesktopLicenseCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    IDesktopDrmCommandRepository drmRepository,
    IStudentQueryRepository studentQueryRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<DeleteStudentDesktopLicenseCommand, StudentDesktopLicenseResultQri>(outer)
{
    public override async Task<CommandResult<StudentDesktopLicenseResultQri>> Handle(DeleteStudentDesktopLicenseCommand command)
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

        long? studentUserId = null;
        if (enrollment.StudentId is > 0)
            studentUserId = await studentQueryRepository.GetUserIdByStudentIdAsync(enrollment.StudentId.Value);

        await DesktopLicenseDeviceResetHelper.ResetAsync(
            enrollment,
            enrollment.CourseId.Value,
            studentUserId,
            drmRepository,
            "License deleted by teacher/admin");

        await drmRepository.ReplaceLessonAccessAsync(enrollment.Id, Array.Empty<long>());
        enrollment.ClearDesktopLicense();

        await drmRepository.CommitAsync();
        await enrollmentCommandRepository.CommitAsync();

        return await ResultAsync(new StudentDesktopLicenseResultQri
        {
            EnrollmentId = enrollment.Id,
            CourseId = enrollment.CourseId ?? 0,
            CourseTitle = course.Title?.Value ?? string.Empty,
            DesktopLicenseKey = null,
            IsDesktopLicenseActive = false,
            DesktopLicenseExpiresAtUtc = null,
            IsCurrentlyValid = false,
        }, ApplicationServiceStatus.Ok);
    }
}
