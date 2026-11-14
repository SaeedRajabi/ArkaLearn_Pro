using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AdminMarkCourseInstallmentPaid;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands;

public class AdminMarkCourseInstallmentPaidCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEnrollmentCommandRepository enrollmentRepository,
    ICourseCommandRepository courseRepository,
    IDesktopDrmCommandRepository drmRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<AdminMarkCourseInstallmentPaidCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(AdminMarkCourseInstallmentPaidCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Unauthorized.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);
        }

        if (command.InstallmentId <= 0)
        {
            AddMessage("Invalid installment id.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var installment = await enrollmentRepository.GetInstallmentByIdAsync(command.InstallmentId);
        if (installment?.Enrollment is null)
        {
            AddMessage("Installment not found.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);
        }

        if (installment.IsPaid)
        {
            AddMessage("This installment has already been paid.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var now = DateTime.UtcNow;
        var reference = BuildReference(command.PaymentReference, command.AdminNote);
        installment.MarkPaid(reference, now);

        var enrollment = installment.Enrollment;
        var paidCount = enrollment.GetPaidInstallmentCount();
        var total = enrollment.Installments.Count;
        var nextDue = enrollment.GetNextUnpaidDueDate();

        if (paidCount >= total)
        {
            enrollment.ConfigureDesktopContentAccess(DesktopContentAccessMode.Full);
            enrollment.RenewDesktopLicense(now.AddYears(1));
            await drmRepository.ReplaceLessonAccessAsync(enrollment.Id, Array.Empty<long>());
        }
        else
        {
            enrollment.RenewDesktopLicense(nextDue ?? now.AddYears(1));
            var courseId = enrollment.CourseId ?? 0;
            var course = courseId > 0 ? await courseRepository.GetCourseForEditAsync(courseId) : null;
            if (course != null)
            {
                var orderedLessonIds = course.CourseSessions
                    .OrderBy(s => s.Id)
                    .SelectMany(s => s.CourseLessons.OrderBy(l => l.SortOrder).Select(l => l.Id))
                    .Where(id => id > 0)
                    .ToList();

                var unlocked = CourseInstallmentUnlockCalculator.GetUnlockedLessonIds(
                    orderedLessonIds, paidCount, total);
                var isPartial = unlocked.Count > 0 && unlocked.Count < orderedLessonIds.Count;
                enrollment.ConfigureDesktopContentAccess(
                    isPartial ? DesktopContentAccessMode.Partial : DesktopContentAccessMode.Full);
                await drmRepository.ReplaceLessonAccessAsync(
                    enrollment.Id,
                    isPartial ? unlocked : Array.Empty<long>());
            }
        }

        await enrollmentRepository.CommitAsync();
        await drmRepository.CommitAsync();
        return await ResultAsync("Installment marked as paid by admin.", ApplicationServiceStatus.Ok);
    }

    private static string BuildReference(string? paymentReference, string? adminNote)
    {
        var reference = paymentReference?.Trim();
        if (!string.IsNullOrWhiteSpace(reference))
            return reference;

        var note = adminNote?.Trim();
        return string.IsNullOrWhiteSpace(note)
            ? $"ADMIN-MANUAL-{DateTime.UtcNow:yyyyMMddHHmmss}"
            : $"ADMIN-MANUAL: {note}";
    }
}
