using ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices;
using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans;
using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Microsoft.Extensions.Configuration;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices;

public sealed class EducationPlanInstallmentReminderScheduler(
    IEducationPlanCommandRepository planRepository,
    INotificationSettingsProvider settingsProvider,
    ISmsNotificationService smsNotificationService,
    ITransactionalEmailNotifier emailNotifier,
    EducationPlanNotifier educationPlanNotifier,
    IManagedRoomStudentCommandRepository managedRoomStudentRepository,
    IUserQueryRepository userQueryRepository,
    IConfiguration configuration) : IEducationPlanInstallmentReminderScheduler
{
    public async Task ProcessDueRemindersAsync(CancellationToken cancellationToken = default)
    {
        var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
        var rules = EducationPlanInstallmentReminderSchedule.Parse(
            settings?.EducationPlanInstallmentReminderRulesJson);
        if (rules.Count == 0)
            return;

        var now = DateTime.UtcNow;
        var today = now.Date;
        var offsetValues = rules.Select(r => r.OffsetDays).ToList();
        var fromDue = today.AddDays(-offsetValues.Max());
        var toDue = today.AddDays(-offsetValues.Min()).AddDays(1).AddTicks(-1);

        var candidates = await planRepository.GetUnpaidInstallmentsForDueDateRangeAsync(
            fromDue,
            toDue,
            cancellationToken);
        if (candidates.Count == 0)
            return;

        var clientBase = (configuration["PaymentGateway:ClientBaseUrl"] ?? "https://arkasoftware.ir").Trim().TrimEnd('/');
        var changed = false;

        foreach (var installment in candidates)
        {
            var plan = installment.EducationPlan;
            if (plan is null || plan.IsDelete)
                continue;

            var dueDate = installment.DueDateUtc.Date;
            foreach (var rule in rules)
            {
                var targetDue = EducationPlanInstallmentReminderSchedule.TargetDueDateUtc(now, rule.OffsetDays);
                if (dueDate != targetDue)
                    continue;
                if (installment.HasReminderOffsetSent(rule.OffsetDays))
                    continue;

                var student = await managedRoomStudentRepository.GetByIdOrDefaultAsync(plan.ManagedRoomStudentId);
                var studentName = student is null
                    ? "دانشجو"
                    : $"{student.FirstName} {student.LastName}".Trim();
                if (string.IsNullOrWhiteSpace(studentName))
                    studentName = "دانشجو";

                var planTitle = plan.Title?.Value ?? "پلن آموزشی";
                var amountLabel = $"{installment.AmountToman:N0} تومان";
                var dueDateLabel = installment.DueDateUtc.ToString("yyyy/MM/dd");
                var paymentLink = $"{clientBase}/account?view=education-plans";

                if (rule.SendStudentSms)
                {
                    try
                    {
                        await smsNotificationService.TrySendEducationPlanInstallmentDueAsync(
                            installment.Id,
                            rule.OffsetDays,
                            cancellationToken);
                    }
                    catch
                    {
                        // continue
                    }
                }

                if (rule.SendStudentEmail)
                {
                    try
                    {
                        var contact = student is null
                            ? null
                            : await userQueryRepository.GetUserLookupByIdentityAsync(
                                student.UserName.Value,
                                student.Email,
                                cancellationToken);
                        string? email = student?.Email?.Trim();
                        if (contact is { UserId: > 0 })
                        {
                            var portalUser = await userQueryRepository.ExecuteAsync(
                                new GetUserByIdQuery { UserId = contact.UserId });
                            if (!string.IsNullOrWhiteSpace(portalUser?.Email))
                                email = portalUser.Email.Trim();
                        }

                        if (!string.IsNullOrWhiteSpace(email))
                        {
                            await emailNotifier.SendEducationPlanInstallmentDueStudentAsync(
                                email,
                                studentName,
                                planTitle,
                                installment.InstallmentNumber,
                                rule.OffsetDays,
                                amountLabel,
                                dueDateLabel,
                                paymentLink,
                                cancellationToken);
                        }
                    }
                    catch
                    {
                        // continue
                    }
                }

                if (rule.SendTeacherEmail && plan.OwnerUserId > 0)
                {
                    try
                    {
                        var teacher = await userQueryRepository.ExecuteAsync(
                            new GetUserByIdQuery { UserId = plan.OwnerUserId });
                        var teacherEmail = teacher?.Email?.Trim();
                        if (!string.IsNullOrWhiteSpace(teacherEmail))
                        {
                            var teacherName = teacher?.FullName?.Trim();
                            if (string.IsNullOrWhiteSpace(teacherName))
                                teacherName = "استاد";

                            await emailNotifier.SendEducationPlanInstallmentDueTeacherAsync(
                                teacherEmail,
                                teacherName,
                                studentName,
                                planTitle,
                                installment.InstallmentNumber,
                                rule.OffsetDays,
                                amountLabel,
                                dueDateLabel,
                                cancellationToken);
                        }
                    }
                    catch
                    {
                        // continue
                    }
                }

                try
                {
                    await educationPlanNotifier.NotifyInstallmentDueAsync(
                        plan.Id,
                        plan.ManagedRoomStudentId,
                        planTitle,
                        installment.InstallmentNumber,
                        installment.AmountToman,
                        installment.DueDateUtc,
                        cancellationToken);
                }
                catch
                {
                    // continue
                }

                installment.MarkReminderOffsetSent(rule.OffsetDays, now);
                changed = true;
            }
        }

        if (changed)
            await planRepository.CommitAsync();
    }
}
