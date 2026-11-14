using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.ApproveCourseEnrollment;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands;

public class ApproveCourseEnrollmentCommandHandler(
    ArkaSoftwareCMPOutServices outerServices,
    IEnrollmentCommandRepository enrollmentCommandRepository,
    ICourseCommandRepository courseCommandRepository,
    IStudentQueryRepository studentQueryRepository,
    ITeacherQueryRepository teacherQueryRepository,
    CourseEnrollmentNotifier enrollmentNotifier,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<ApproveCourseEnrollmentCommand, ApproveCourseEnrollmentResult>(outerServices)
{
    public override async Task<CommandResult<ApproveCourseEnrollmentResult>> Handle(ApproveCourseEnrollmentCommand command)
    {
        if (!TryGetCurrentUserId(out var userId))
            return await ResultAsync(new ApproveCourseEnrollmentResult(), ApplicationServiceStatus.ValidationError);

        var enrollment = await enrollmentCommandRepository.GetAsync(command.EnrollmentId);
        if (enrollment == null)
            return await ResultAsync(new ApproveCourseEnrollmentResult(), ApplicationServiceStatus.NotFound);

        var course = await courseCommandRepository.GetAsync(enrollment.CourseId ?? 0);
        if (course == null || course.DeliveryMode != CourseDeliveryMode.SpotPlayerLicense)
            return await ResultAsync(new ApproveCourseEnrollmentResult(), ApplicationServiceStatus.ValidationError);

        if (!await CanApproveAsync(userId, course.TeacherId))
            return await ResultAsync(new ApproveCourseEnrollmentResult(), ApplicationServiceStatus.ValidationError);

        if (enrollment.IsActive && !string.IsNullOrWhiteSpace(enrollment.SpotPlayerLicense))
        {
            return await OkAsync(new ApproveCourseEnrollmentResult
            {
                EnrollmentId = enrollment.Id,
                SpotPlayerLicense = enrollment.SpotPlayerLicense!,
                CourseTitle = course.Title?.Value ?? string.Empty,
            });
        }

        var license = SpotPlayerLicenseGenerator.Generate(course, enrollment.StudentId ?? 0);
        enrollment.ApproveSpotPlayerLicense(license);
        await enrollmentCommandRepository.CommitAsync();

        var studentUserId = await studentQueryRepository.GetUserIdByStudentIdAsync(enrollment.StudentId ?? 0);
        if (studentUserId is > 0)
            await enrollmentNotifier.NotifyLicenseApprovedAsync(course, studentUserId.Value, license);

        return await OkAsync(new ApproveCourseEnrollmentResult
        {
            EnrollmentId = enrollment.Id,
            SpotPlayerLicense = license,
            CourseTitle = course.Title?.Value ?? string.Empty,
        });
    }

    private async Task<bool> CanApproveAsync(long userId, long? teacherId)
    {
        if (IsAdminUser())
            return true;

        if (teacherId is not > 0)
            return false;

        var ownTeacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(userId);
        return ownTeacherId.HasValue && ownTeacherId.Value == teacherId.Value;
    }

    private bool IsAdminUser()
    {
        var user = httpContextAccessor.HttpContext?.User;
        if (user == null)
            return false;

        var roleClaim = user.FindFirst("role")?.Value ?? user.FindFirst(ClaimTypes.Role)?.Value;
        return roleClaim is "3" or "Admin" or "Super Admin";
    }

    private bool TryGetCurrentUserId(out long userId)
    {
        var claimValue = httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value
            ?? httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(claimValue, out userId);
    }
}
