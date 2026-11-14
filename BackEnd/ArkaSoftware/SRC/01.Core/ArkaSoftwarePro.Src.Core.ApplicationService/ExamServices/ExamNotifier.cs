using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Utilities.OutService.DateTimes;
using Microsoft.Extensions.Configuration;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ExamServices;

public class ExamNotifier(
    IUserNotificationCommandRepository notificationRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IUserQueryRepository userQueryRepository,
    ITransactionalEmailNotifier emailNotifier,
    IConfiguration configuration)
{
    public async Task NotifyExamAssignedAsync(
        long studentUserId,
        string examTitle,
        string examDescription,
        string level,
        DateTime endsAtUtc,
        int durationMinutes,
        long teacherUserId,
        long examId,
        long attemptId)
    {
        await notificationRepository.InsertAsync(UserNotification.Create(
            studentUserId,
            "New exam assigned",
            $"You have been assigned to exam \"{examTitle}\".",
            "exam_assigned",
            $"/account/exams/{examId}/take",
            attemptId));
        await notificationRepository.CommitAsync();

        await TrySendAssignedEmailAsync(
            studentUserId,
            examTitle,
            examDescription,
            level,
            endsAtUtc,
            durationMinutes,
            teacherUserId);
    }

    private async Task TrySendAssignedEmailAsync(
        long studentUserId,
        string examTitle,
        string examDescription,
        string level,
        DateTime endsAtUtc,
        int durationMinutes,
        long teacherUserId)
    {
        try
        {
            var student = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = studentUserId });
            var email = student?.Email?.Trim();
            if (string.IsNullOrWhiteSpace(email))
                return;

            var recipientName = string.IsNullOrWhiteSpace(student?.FullName) ? "دانشجو" : student!.FullName!.Trim();

            var teacher = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = teacherUserId });
            var professorName = string.IsNullOrWhiteSpace(teacher?.FullName) ? "استاد" : teacher!.FullName!.Trim();

            var levelLabel = level?.Trim().ToLowerInvariant() switch
            {
                "beginner" => "مبتدی",
                "intermediate" => "متوسط",
                "advanced" => "پیشرفته",
                _ => level ?? "—",
            };

            var deadlineLabel = endsAtUtc.ToPersianDateTimeString("yyyy/MM/dd - HH:mm");

            var clientBase = (configuration["PaymentGateway:ClientBaseUrl"] ?? "https://arkasoftware.ir").Trim().TrimEnd('/');

            await emailNotifier.SendExamAssignedAsync(
                email,
                recipientName,
                professorName,
                string.IsNullOrWhiteSpace(examTitle) ? "آزمون" : examTitle.Trim(),
                examDescription ?? string.Empty,
                levelLabel,
                $"{durationMinutes} دقیقه",
                deadlineLabel,
                $"{clientBase}/account?view=my-exams");
        }
        catch
        {
            // Non-blocking notification: email failures must not fail exam creation.
        }
    }

    public async Task NotifyExamSubmittedAsync(
        long teacherUserId,
        string examTitle,
        string studentName,
        long examId,
        long attemptId,
        DateTime? startedAtUtc = null,
        DateTime? submittedAtUtc = null,
        int durationMinutes = 0,
        int questionCount = 0)
    {
        await notificationRepository.InsertAsync(UserNotification.Create(
            teacherUserId,
            "Exam submitted",
            $"{studentName} submitted exam \"{examTitle}\".",
            "exam_submitted",
            $"/professor/exams/{examId}?attempt={attemptId}",
            attemptId));
        await notificationRepository.CommitAsync();

        await TrySendSubmittedEmailAsync(
            teacherUserId,
            examTitle,
            studentName,
            startedAtUtc,
            submittedAtUtc,
            durationMinutes,
            questionCount,
            examId,
            attemptId);
    }

    private async Task TrySendSubmittedEmailAsync(
        long teacherUserId,
        string examTitle,
        string studentName,
        DateTime? startedAtUtc,
        DateTime? submittedAtUtc,
        int durationMinutes,
        int questionCount,
        long examId,
        long attemptId)
    {
        try
        {
            var teacher = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = teacherUserId });
            var email = teacher?.Email?.Trim();
            if (string.IsNullOrWhiteSpace(email))
                return;

            var recipientName = string.IsNullOrWhiteSpace(teacher?.FullName) ? "استاد" : teacher!.FullName!.Trim();

            var minutesTaken = startedAtUtc.HasValue && submittedAtUtc.HasValue
                ? Math.Max(1, (int)Math.Round((submittedAtUtc.Value - startedAtUtc.Value).TotalMinutes))
                : Math.Max(1, durationMinutes);
            var durationLabel = $"{minutesTaken} دقیقه";
            var questionCountLabel = $"{questionCount} سوال";

            var clientBase = (configuration["PaymentGateway:ClientBaseUrl"] ?? "https://arkasoftware.ir").Trim().TrimEnd('/');

            await emailNotifier.SendExamSubmittedToTeacherAsync(
                email,
                recipientName,
                string.IsNullOrWhiteSpace(studentName) ? "دانشجو" : studentName.Trim(),
                string.IsNullOrWhiteSpace(examTitle) ? "آزمون" : examTitle.Trim(),
                durationLabel,
                questionCountLabel,
                $"{clientBase}/professor/exams/{examId}?attempt={attemptId}");
        }
        catch
        {
            // Non-blocking notification: email failures must not fail exam submission.
        }
    }

    public async Task NotifyExamGradedAsync(long studentUserId, string examTitle, decimal finalScore, long attemptId)
    {
        await notificationRepository.InsertAsync(UserNotification.Create(
            studentUserId,
            "Exam graded",
            $"Your exam \"{examTitle}\" has been graded. Score: {finalScore}",
            "exam_graded",
            $"/account/exams/{attemptId}/result",
            attemptId));
        await notificationRepository.CommitAsync();
    }

    public async Task<long?> ResolveTeacherUserIdAsync(long teacherId)
        => await teacherQueryRepository.GetUserIdByTeacherIdAsync(teacherId);
}
