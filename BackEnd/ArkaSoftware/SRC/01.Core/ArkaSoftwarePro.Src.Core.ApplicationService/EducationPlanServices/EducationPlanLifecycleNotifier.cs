using System.Text;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Microsoft.Extensions.Configuration;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices;

/// <summary>Sends in-app + SMS + email when a private education plan is created or updated.</summary>
public class EducationPlanLifecycleNotifier(
    EducationPlanNotifier educationPlanNotifier,
    ISmsNotificationService smsNotificationService,
    ITransactionalEmailNotifier emailNotifier,
    IManagedRoomStudentCommandRepository managedRoomStudentRepository,
    IUserQueryRepository userQueryRepository,
    IConfiguration configuration)
{
    public async Task NotifyPlanSavedAsync(
        EducationPlan plan,
        bool isCreate,
        CancellationToken cancellationToken = default)
    {
        await educationPlanNotifier.NotifyPlanAssignedAsync(
            plan.Id,
            plan.ManagedRoomStudentId,
            plan.Title?.Value ?? "Education Plan",
            plan.OwnerUserId,
            cancellationToken);

        await smsNotificationService.TrySendEducationPlanAssignedAsync(plan.Id, cancellationToken);

        await TrySendAssignedEmailAsync(plan, cancellationToken);
    }

    private async Task TrySendAssignedEmailAsync(EducationPlan plan, CancellationToken cancellationToken)
    {
        try
        {
            var student = await managedRoomStudentRepository.GetByIdOrDefaultAsync(plan.ManagedRoomStudentId);
            if (student is null)
                return;

            var contact = await userQueryRepository.GetUserLookupByIdentityAsync(
                student.UserName.Value,
                student.Email,
                cancellationToken);

            string? email = student.Email?.Trim();
            string? recipientName = $"{student.FirstName} {student.LastName}".Trim();

            if (contact is { UserId: > 0 })
            {
                var portalUser = await userQueryRepository.ExecuteAsync(
                    new GetUserByIdQuery { UserId = contact.UserId });
                if (!string.IsNullOrWhiteSpace(portalUser?.Email))
                    email = portalUser.Email.Trim();
                if (string.IsNullOrWhiteSpace(recipientName) && !string.IsNullOrWhiteSpace(portalUser?.FullName))
                    recipientName = portalUser.FullName.Trim();
            }

            if (string.IsNullOrWhiteSpace(email))
                return;

            if (string.IsNullOrWhiteSpace(recipientName))
                recipientName = "دانشجو";

            var teacher = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = plan.OwnerUserId });
            var teacherName = teacher?.FullName?.Trim();
            if (string.IsNullOrWhiteSpace(teacherName))
                teacherName = "استاد";

            var clientBase = (configuration["PaymentGateway:ClientBaseUrl"] ?? "https://arkasoftware.ir").Trim().TrimEnd('/');
            var isInstallment = plan.PaymentType == EducationPlanPaymentType.Installment;
            var installmentsHtml = isInstallment
                ? BuildInstallmentsHtml(plan.Installments)
                : string.Empty;

            await emailNotifier.SendEducationPlanAssignedAsync(
                email,
                recipientName,
                plan.Title?.Value ?? "پلن آموزشی",
                teacherName,
                plan.TotalHours.ToString("0.##"),
                $"{plan.FinalTotalCostToman:N0} تومان",
                isInstallment ? "اقساطی" : "نقدی",
                installmentsHtml,
                $"{clientBase}/account?view=education-plans",
                cancellationToken);
        }
        catch
        {
            // Non-blocking notification
        }
    }

    private static string BuildInstallmentsHtml(IEnumerable<EducationPlanInstallment> installments)
    {
        var rows = installments
            .OrderBy(i => i.InstallmentNumber)
            .ToList();
        if (rows.Count == 0)
            return "جزئیات اقساط ثبت نشده است.";

        var sb = new StringBuilder();
        sb.Append("<ul style=\"margin:0;padding-right:18px;text-align:right;direction:rtl;\">");
        foreach (var row in rows)
        {
            sb.Append("<li style=\"margin-bottom:6px;\">")
                .Append($"قسط {row.InstallmentNumber}: <strong>{row.AmountToman:N0} تومان</strong>")
                .Append($" — سررسید {row.DueDateUtc:yyyy/MM/dd}")
                .Append(row.IsPaid ? " (پرداخت‌شده)" : string.Empty)
                .Append("</li>");
        }

        sb.Append("</ul>");
        return sb.ToString();
    }
}
