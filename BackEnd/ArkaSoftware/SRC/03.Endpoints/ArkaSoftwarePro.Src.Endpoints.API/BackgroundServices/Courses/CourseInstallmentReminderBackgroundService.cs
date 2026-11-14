using ArkaSoftwarePro.Src.Core.Contracts.Courses;

namespace ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.Courses;

public sealed class CourseInstallmentReminderBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<CourseInstallmentReminderBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var scheduler = scope.ServiceProvider.GetRequiredService<ICourseInstallmentReminderScheduler>();
                await scheduler.ProcessDueRemindersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Course installment reminder job failed.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
