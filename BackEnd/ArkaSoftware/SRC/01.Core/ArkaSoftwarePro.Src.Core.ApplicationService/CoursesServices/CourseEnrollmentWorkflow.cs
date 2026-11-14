using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Microsoft.Extensions.Logging;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;

public static class SpotPlayerLicenseGenerator
{
    public static string Generate(Course course, long studentId)
    {
        var prefix = string.IsNullOrWhiteSpace(course.SpotPlayerCourseKey)
            ? $"C{course.Id}"
            : course.SpotPlayerCourseKey.Trim();
        var token = Guid.NewGuid().ToString("N")[..12].ToUpperInvariant();
        return $"SPOT-{prefix}-S{studentId}-{token}";
    }
}

public class CourseEnrollmentNotifier(
    ISupportTicketCommandRepository supportTicketCommandRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IUserNotificationCommandRepository notificationRepository,
    IUserQueryRepository userQueryRepository,
    ITransactionalEmailNotifier transactionalEmailNotifier,
    ILogger<CourseEnrollmentNotifier> logger)
{
    public async Task NotifyLicenseRegistrationPendingAsync(
        Course course,
        Enrollment enrollment,
        string studentDisplayName)
    {
        var recipientIds = await ResolveCourseStaffUserIdsAsync(course);
        if (recipientIds.Count == 0)
            return;

        var courseTitle = course.Title?.Value ?? "دوره";
        var notifications = recipientIds.Select(userId => UserNotification.Create(
            userId,
            "درخواست لایسنس دوره",
            $"{studentDisplayName} دوره «{courseTitle}» را خریداری کرده و درخواست صدور لایسنس دارد.",
            "course_enrollment_pending",
            $"/professor/students?courseId={course.Id}",
            enrollment.Id)).ToList();

        await notificationRepository.InsertManyAsync(notifications);
        await notificationRepository.CommitAsync();

        await NotifyTeacherByEmailAsync(
            course,
            recipientIds,
            studentDisplayName,
            courseTitle,
            isLicenseRequest: true);
    }

    public async Task NotifyStudentEnrolledAsync(
        Course course,
        Enrollment enrollment,
        string studentDisplayName)
    {
        var recipientIds = await ResolveCourseStaffUserIdsAsync(course);
        if (recipientIds.Count == 0)
            return;

        var courseTitle = course.Title?.Value ?? "دوره";
        var notifications = recipientIds.Select(userId => UserNotification.Create(
            userId,
            "ثبت‌نام دانشجو در دوره",
            $"{studentDisplayName} در دوره «{courseTitle}» ثبت‌نام کرد.",
            "course_enrollment",
            "/professor/students",
            enrollment.Id)).ToList();

        await notificationRepository.InsertManyAsync(notifications);
        await notificationRepository.CommitAsync();

        await NotifyTeacherByEmailAsync(
            course,
            recipientIds,
            studentDisplayName,
            courseTitle,
            isLicenseRequest: false);
    }

    public async Task NotifyLicenseApprovedAsync(
        Course course,
        long studentUserId,
        string license,
        string? accessLabel = null,
        DateTime? expiresAtUtc = null)
    {
        var courseTitle = course.Title?.Value ?? "دوره";
        var access = string.IsNullOrWhiteSpace(accessLabel) ? "دسترسی کامل" : accessLabel.Trim();
        var duration = expiresAtUtc.HasValue
            ? $"تا {expiresAtUtc.Value.ToLocalTime():yyyy/MM/dd}"
            : "بدون محدودیت زمانی مشخص";

        await notificationRepository.InsertAsync(UserNotification.Create(
            studentUserId,
            "لایسنس دوره تأیید شد",
            $"دوره «{courseTitle}» توسط استاد تأیید شد. لایسنس جدید با {access} برای شما ({duration}) صادر شد. کد: {license}",
            "course_license_approved",
            "/account?view=my-courses",
            course.Id));
        await notificationRepository.CommitAsync();
    }

    private async Task NotifyTeacherByEmailAsync(
        Course course,
        List<long> recipientUserIds,
        string studentDisplayName,
        string courseTitle,
        bool isLicenseRequest)
    {
        if (course.TeacherId is not > 0)
            return;

        try
        {
            var teacherUserId = await teacherQueryRepository.GetUserIdByTeacherIdAsync(course.TeacherId.Value);
            if (teacherUserId is not > 0 || !recipientUserIds.Contains(teacherUserId.Value))
                return;

            var teacher = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = teacherUserId.Value });
            if (teacher is null || string.IsNullOrWhiteSpace(teacher.Email))
                return;

            var teacherName = string.IsNullOrWhiteSpace(teacher.FullName) ? teacher.UserName ?? "استاد" : teacher.FullName!;

            if (isLicenseRequest)
            {
                await transactionalEmailNotifier.SendTeacherDesktopLicenseRequestAsync(
                    teacher.Email!,
                    teacherName,
                    studentDisplayName,
                    courseTitle,
                    $"/professor/students?courseId={course.Id}");
            }
            else
            {
                await transactionalEmailNotifier.SendTeacherCoursePurchaseAsync(
                    teacher.Email!,
                    teacherName,
                    studentDisplayName,
                    courseTitle,
                    "/professor/earnings");
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to email teacher about course {CourseId}", course.Id);
        }
    }

    private async Task<List<long>> ResolveCourseStaffUserIdsAsync(Course course)
    {
        var recipientIds = await supportTicketCommandRepository.GetAdminUserIdsAsync();

        if (course.TeacherId is > 0)
        {
            var teacherUserId = await teacherQueryRepository.GetUserIdByTeacherIdAsync(course.TeacherId.Value);
            if (teacherUserId is > 0 && !recipientIds.Contains(teacherUserId.Value))
                recipientIds.Add(teacherUserId.Value);
        }

        return recipientIds;
    }
}
