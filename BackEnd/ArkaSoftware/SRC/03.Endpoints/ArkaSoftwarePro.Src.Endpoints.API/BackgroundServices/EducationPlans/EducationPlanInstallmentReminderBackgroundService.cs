namespace ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.EducationPlans;

public sealed class EducationPlanInstallmentReminderBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<EducationPlanInstallmentReminderBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var scheduler = scope.ServiceProvider
                    .GetRequiredService<ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.IEducationPlanInstallmentReminderScheduler>();
                await scheduler.ProcessDueRemindersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Education plan installment reminder processing failed.");
            }

            await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
        }
    }
}
