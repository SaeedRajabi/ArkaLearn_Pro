namespace ArkaSoftwarePro.Src.Core.Contracts.Courses;

public interface ICourseInstallmentReminderScheduler
{
    Task ProcessDueRemindersAsync(CancellationToken cancellationToken = default);
}
