using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.AddEducationPlans;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices.Commands
{
    public class AddEducationPlanCommandHandler : CommandHandler<AddEducationPlanCommand, string>
    {
        private readonly IEducationPlanCommandRepository _educationPlanCommandRepository;
        private readonly EducationPlanLifecycleNotifier _lifecycleNotifier;

        public AddEducationPlanCommandHandler(
            ArkaSoftwareCMPOutServices mafiaOuterServices,
            IEducationPlanCommandRepository educationPlanCommandRepository,
            EducationPlanLifecycleNotifier lifecycleNotifier) : base(mafiaOuterServices)
        {
            _educationPlanCommandRepository = educationPlanCommandRepository;
            _lifecycleNotifier = lifecycleNotifier;
        }

        public override async Task<CommandResult<string>> Handle(AddEducationPlanCommand command)
        {
            try
            {
                var paymentType = EducationPlanPaymentMapper.ParsePaymentType(command.PaymentType);
                var installments = EducationPlanPaymentMapper.MapInstallments(command.Installments);
                EducationPlanPaymentMapper.ValidateInstallmentSchedule(paymentType, command.TotalCost, installments);

                var educationPlan = EducationPlan.CreatePrivatePlan(
                    command.Title!,
                    command.HourlyRate,
                    command.TotalHours,
                    command.TotalCost,
                    command.Description ?? string.Empty,
                    command.ManagedRoomStudentId,
                    command.RoomId,
                    command.OwnerUserId,
                    command.StartDateUtc,
                    command.EndDateUtc,
                    paymentType,
                    installments);
                await _educationPlanCommandRepository.InsertAsync(educationPlan);
                await _educationPlanCommandRepository.CommitAsync();
                await _lifecycleNotifier.NotifyPlanSavedAsync(educationPlan, isCreate: true);
                return await ResultAsync("CoursePlan Added Success.", ApplicationServiceStatus.Ok);
            }
            catch
            {
                return await ResultAsync("Course Is Not Added.", ApplicationServiceStatus.Exception);
            }
        }
    }
}
