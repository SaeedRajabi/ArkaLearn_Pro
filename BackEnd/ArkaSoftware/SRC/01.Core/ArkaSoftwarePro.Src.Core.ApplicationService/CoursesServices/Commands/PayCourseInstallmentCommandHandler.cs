using ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.PayCourseInstallment;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands;

public class PayCourseInstallmentCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEnrollmentCommandRepository enrollmentRepository,
    ICourseCommandRepository courseRepository,
    IDesktopDrmCommandRepository drmRepository,
    IStudentQueryRepository studentQueryRepository)
    : CommandHandler<PayCourseInstallmentCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(PayCourseInstallmentCommand command)
    {
        if (command.InstallmentId <= 0 || command.UserId <= 0)
        {
            AddMessage("Invalid payment request.");
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

        var studentId = await studentQueryRepository.GetStudentIdByUserIdAsync(command.UserId);
        if (!studentId.HasValue || installment.Enrollment.StudentId != studentId.Value)
        {
            AddMessage("You are not authorized to pay this installment.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var now = DateTime.UtcNow;
        installment.MarkPaid(command.PaymentReference, now);

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
        return await ResultAsync("Installment payment recorded successfully.", ApplicationServiceStatus.Ok);
    }
}
