using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.UpdateEducationPlan;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices.Commands;

public class UpdateEducationPlanCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEducationPlanCommandRepository repository,
    ISmsNotificationService smsNotificationService,
    EducationPlanNotifier educationPlanNotifier,
    EducationPlanLifecycleNotifier lifecycleNotifier)
    : CommandHandler<UpdateEducationPlanCommand, bool>(outer)
{
    public override async Task<CommandResult<bool>> Handle(UpdateEducationPlanCommand command)
    {
        try
        {
            var plan = await repository.GetByIdWithInstallmentsAsync(command.PlanId);
            if (plan == null)
                return await ResultAsync(false, ApplicationServiceStatus.NotFound);

            var previousManagedRoomStudentId = plan.ManagedRoomStudentId;
            var ownerUserId = plan.OwnerUserId;
            var previousTitle = plan.Title?.Value ?? command.Title!;

            var paymentType = EducationPlanPaymentMapper.ParsePaymentType(command.PaymentType);
            var installments = EducationPlanPaymentMapper.MapInstallments(command.Installments);
            EducationPlanPaymentMapper.ValidateInstallmentSchedule(paymentType, command.TotalCost, installments);

            plan.UpdateDetails(
                command.Title!,
                command.HourlyRate,
                command.TotalHours,
                command.TotalCost,
                command.Description ?? string.Empty,
                command.ManagedRoomStudentId,
                command.RoomId,
                command.StartDateUtc,
                command.EndDateUtc,
                paymentType,
                installments);

            await repository.CommitAsync();

            if (command.ManagedRoomStudentId != previousManagedRoomStudentId
                && previousManagedRoomStudentId > 0)
            {
                await educationPlanNotifier.NotifyPlanRemovedAsync(
                    command.PlanId,
                    previousManagedRoomStudentId,
                    previousTitle,
                    ownerUserId);
                await smsNotificationService.TrySendEducationPlanRemovedAsync(
                    previousManagedRoomStudentId,
                    previousTitle,
                    ownerUserId);
            }

            // Always notify the (current) student on save with latest schedule details.
            await lifecycleNotifier.NotifyPlanSavedAsync(plan, isCreate: false);

            return await OkAsync(true);
        }
        catch (Exception ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(false, ApplicationServiceStatus.ValidationError);
        }
    }
}
