using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.PayEducationPlanInstallment;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices.Commands;

public class PayEducationPlanInstallmentCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEducationPlanCommandRepository planRepository,
    IEducationPlanQueryRepository planQueryRepository,
    IUserQueryRepository userQueryRepository)
    : CommandHandler<PayEducationPlanInstallmentCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(PayEducationPlanInstallmentCommand command)
    {
        var result = new CommandResult<string>();

        if (command.InstallmentId <= 0 || command.UserId <= 0)
        {
            result.AddMessage("Invalid payment request.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var installment = await planRepository.GetInstallmentByIdAsync(command.InstallmentId);
        if (installment?.EducationPlan is null || installment.EducationPlan.IsDelete)
        {
            result.AddMessage("Installment not found.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);
        }

        var plan = installment.EducationPlan;
        if (plan.PaymentType != EducationPlanPaymentType.Installment)
        {
            result.AddMessage("This plan does not use installment payment.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        if (installment.IsPaid)
        {
            result.AddMessage("This installment has already been paid.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = command.UserId });
        var studentIds = await planQueryRepository.ResolveManagedStudentIdsForUserAsync(
            command.UserId,
            user?.UserName ?? string.Empty,
            user?.Email);

        if (!studentIds.Contains(plan.ManagedRoomStudentId))
        {
            result.AddMessage("You are not authorized to pay this installment.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }

        installment.MarkPaid(command.PaymentReference, DateTime.UtcNow);
        await planRepository.CommitAsync();

        return await ResultAsync("Installment payment recorded successfully.", ApplicationServiceStatus.Ok);
    }
}
