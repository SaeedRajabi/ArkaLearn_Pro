using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.DeleteEducationPlan;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices.Commands;

public class DeleteEducationPlanCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEducationPlanCommandRepository repository,
    EducationPlanNotifier educationPlanNotifier,
    ISmsNotificationService smsNotificationService)
    : CommandHandler<DeleteEducationPlanCommand, bool>(outer)
{
    public override async Task<CommandResult<bool>> Handle(DeleteEducationPlanCommand command)
    {
        var plan = await repository.GetByIdWithUsagesAsync(command.PlanId);
        if (plan == null)
            return await ResultAsync(false, ApplicationServiceStatus.NotFound);

        var planTitle = plan.Title?.Value ?? "Education Plan";
        var managedRoomStudentId = plan.ManagedRoomStudentId;
        var ownerUserId = plan.OwnerUserId;

        await educationPlanNotifier.NotifyPlanRemovedAsync(
            plan.Id,
            managedRoomStudentId,
            planTitle,
            ownerUserId);
        await smsNotificationService.TrySendEducationPlanRemovedAsync(
            managedRoomStudentId,
            planTitle,
            ownerUserId);

        repository.Delete(plan);
        await repository.CommitAsync();
        return await OkAsync(true);
    }
}
