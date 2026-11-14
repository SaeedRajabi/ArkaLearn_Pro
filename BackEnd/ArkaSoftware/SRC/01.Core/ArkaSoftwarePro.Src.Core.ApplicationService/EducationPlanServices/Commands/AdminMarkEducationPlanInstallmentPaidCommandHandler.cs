using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.AdminMarkEducationPlanInstallmentPaid;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices.Commands;

public class AdminMarkEducationPlanInstallmentPaidCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEducationPlanCommandRepository planRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<AdminMarkEducationPlanInstallmentPaidCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(AdminMarkEducationPlanInstallmentPaidCommand command)
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

        var installment = await planRepository.GetInstallmentByIdAsync(command.InstallmentId);
        if (installment?.EducationPlan is null || installment.EducationPlan.IsDelete)
        {
            AddMessage("Installment not found.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);
        }

        var plan = installment.EducationPlan;
        if (plan.PaymentType != EducationPlanPaymentType.Installment)
        {
            AddMessage("This plan does not use installment payment.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        if (installment.IsPaid)
        {
            AddMessage("This installment has already been paid.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var reference = BuildReference(command.PaymentReference, command.AdminNote);
        installment.MarkPaid(reference, DateTime.UtcNow);
        await planRepository.CommitAsync();

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
