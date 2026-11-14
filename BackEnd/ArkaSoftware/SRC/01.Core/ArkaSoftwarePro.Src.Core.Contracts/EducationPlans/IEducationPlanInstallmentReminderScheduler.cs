namespace ArkaSoftwarePro.Src.Core.Contracts.EducationPlans;

public interface IEducationPlanInstallmentReminderScheduler
{
    Task ProcessDueRemindersAsync(CancellationToken cancellationToken = default);
}
