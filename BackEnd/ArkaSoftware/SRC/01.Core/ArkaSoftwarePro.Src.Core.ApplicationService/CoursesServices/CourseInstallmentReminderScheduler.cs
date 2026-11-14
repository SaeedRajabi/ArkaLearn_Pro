using ArkaSoftwarePro.Src.Core.Contracts.Courses;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Enrollments.EnrollmentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using Microsoft.Extensions.Configuration;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices;

public sealed class CourseInstallmentReminderScheduler(
    IEnrollmentCommandRepository enrollmentRepository,
    ITransactionalEmailNotifier emailNotifier,
    ISmsNotificationService smsNotificationService,
    IConfiguration configuration) : ICourseInstallmentReminderScheduler
{
    public async Task ProcessDueRemindersAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var due = await enrollmentRepository.GetDueCourseInstallmentRemindersAsync(now, cancellationToken);
        if (due.Count == 0)
            return;

        var clientBase = (configuration["PaymentGateway:ClientBaseUrl"] ?? "https://arkasoftware.ir").Trim().TrimEnd('/');

        foreach (var installment in due)
        {
            var enrollment = installment.Enrollment;
            if (enrollment is null) continue;

            var daysRemaining = (installment.DueDate.Date - now.Date).Days;
            daysRemaining = Math.Clamp(daysRemaining, 0, 2);

            var email = enrollment.Student?.User?.Email?.Value;
            var name = enrollment.Student?.User != null
                ? $"{enrollment.Student.User.UserFullName}"
                : "دانشجو";
            var courseTitle = enrollment.Course?.Title?.Value ?? "دوره";
            var amountLabel = $"{installment.Amount:N0} تومان";
            var paymentLink = $"{clientBase}/account/course-installments/pay?installmentId={installment.Id}";

            if (!string.IsNullOrWhiteSpace(email))
            {
                try
                {
                    await emailNotifier.SendCourseInstallmentDueAsync(
                        email,
                        name,
                        courseTitle,
                        installment.InstallmentNumber,
                        daysRemaining,
                        amountLabel,
                        paymentLink,
                        cancellationToken);
                }
                catch
                {
                    // continue
                }
            }

            try
            {
                var phoneObj = enrollment.Student?.User?.PhoneNumber;
                var phone = phoneObj is null ? null : $"{phoneObj.CountryCode}{phoneObj.Number}";
                if (!string.IsNullOrWhiteSpace(phone))
                {
                    await smsNotificationService.TrySendCourseInstallmentDueMessageAsync(
                        phone,
                        name,
                        courseTitle,
                        daysRemaining,
                        paymentLink,
                        cancellationToken);
                }
            }
            catch
            {
                // continue
            }

            if (daysRemaining >= 2)
                installment.MarkReminderTwoDaysSent(now);
            else if (daysRemaining == 1)
                installment.MarkReminderOneDaySent(now);
            else
                installment.MarkReminderDueDaySent(now);
        }

        await enrollmentRepository.CommitAsync();
    }
}
