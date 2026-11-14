using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.MediaServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.ReviewCourseModeration;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands;

public class ReviewCourseModerationCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ICourseCommandRepository courseCommandRepository,
    ITeacherCommandRepository teacherCommandRepository,
    TeacherContentNotifier contentNotifier,
    TeacherXpService teacherXpService,
    TeacherFollowNotifier teacherFollowNotifier,
    INewsletterPublishNotifier newsletterPublishNotifier,
    IVideoWatermarkQueue videoWatermarkQueue,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<ReviewCourseModerationCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ReviewCourseModerationCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync("Access denied.", ApplicationServiceStatus.ValidationError);

        if (!command.Approve && string.IsNullOrWhiteSpace(command.RejectionNote))
            return await ResultAsync("Rejection note is required.", ApplicationServiceStatus.ValidationError);

        var itemType = (command.ItemType ?? string.Empty).Trim().ToLowerInvariant();
        var course = await courseCommandRepository.GetCourseForEditAsync(command.CourseId);
        if (course == null)
            return await ResultAsync("Course not found.", ApplicationServiceStatus.NotFound);

        var teacher = course.TeacherId is > 0
            ? await teacherCommandRepository.GetByIdWithDetailsAsync(course.TeacherId.Value)
            : null;
        var teacherUserId = teacher?.UserId ?? 0;
        var courseTitle = course.Title?.Value ?? string.Empty;

        if (itemType is "course")
        {
            course.SetModerationStatus(
                command.Approve ? TeacherApprovalStatus.Approved : TeacherApprovalStatus.Rejected,
                command.RejectionNote);
            await courseCommandRepository.CommitAsync();

            if (teacherUserId > 0)
            {
                await contentNotifier.NotifyTeacherContentReviewedAsync(
                    teacherUserId,
                    command.Approve,
                    command.RejectionNote,
                    "course",
                    courseTitle,
                    "/professor/courses");
            }

            if (command.Approve && teacher != null && course.IsPublish)
            {
                var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
                await teacherXpService.TryAwardOnceAsync(
                    teacher,
                    settings.XpRewardPublishCourse,
                    TeacherXpEventReason.PublishCourse,
                    course.Id);

                var displayName = teacher.User != null
                    ? $"{teacher.User.UserFullName?.FirstName} {teacher.User.UserFullName?.LastName}".Trim()
                    : string.Empty;
                await teacherFollowNotifier.NotifyFollowersContentPublishedAsync(
                    teacher.Id,
                    teacher.UserId,
                    "teacher_new_course",
                    displayName,
                    courseTitle,
                    $"/courses/{CourseSlugHelper.FromTitle(courseTitle, course.Id)}",
                    course.Id);
                await newsletterPublishNotifier.NotifyContentPublishedAsync(
                    NewsletterContentKind.Course,
                    courseTitle,
                    $"/courses/{CourseSlugHelper.FromTitle(courseTitle, course.Id)}",
                    teacher.Id,
                    teacher.UserId,
                    displayName);
            }

            return await OkAsync(command.Approve ? "Course approved." : "Course rejected.");
        }

        if (itemType is "lesson_video" or "lesson" or "lessonvideo")
        {
            if (!command.LessonId.HasValue || command.LessonId.Value <= 0)
                return await ResultAsync("Lesson id is required.", ApplicationServiceStatus.ValidationError);

            var lesson = course.FindLesson(command.LessonId.Value);
            if (lesson == null)
                return await ResultAsync("Lesson not found.", ApplicationServiceStatus.NotFound);

            lesson.SetVideoModerationStatus(
                command.Approve ? TeacherApprovalStatus.Approved : TeacherApprovalStatus.Rejected,
                command.RejectionNote);
            await courseCommandRepository.CommitAsync();

            if (teacherUserId > 0)
            {
                await contentNotifier.NotifyTeacherContentReviewedAsync(
                    teacherUserId,
                    command.Approve,
                    command.RejectionNote,
                    "lesson_video",
                    lesson.LessonTitle?.Value ?? courseTitle,
                    "/professor/courses");
            }

            if (command.Approve)
            {
                videoWatermarkQueue.EnqueueLessonVideoWatermark(
                    course.Id,
                    lesson.Id,
                    lesson.VideoPath?.Value);
            }

            return await OkAsync(command.Approve ? "Lesson video approved." : "Lesson video rejected.");
        }

        return await ResultAsync("Invalid item type.", ApplicationServiceStatus.ValidationError);
    }
}
