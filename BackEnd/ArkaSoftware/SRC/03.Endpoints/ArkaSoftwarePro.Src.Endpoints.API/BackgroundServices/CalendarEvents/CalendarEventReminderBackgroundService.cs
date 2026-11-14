namespace ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.CalendarEvents;

public class CalendarEventReminderBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<CalendarEventReminderBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var scheduler = scope.ServiceProvider.GetRequiredService<ArkaSoftwarePro.Src.Core.Contracts.CalendarEvents.ICalendarEventReminderScheduler>();
                await scheduler.ProcessDueRemindersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Calendar event reminder processing failed.");
            }

            await Task.Delay(
                TimeSpan.FromSeconds(ArkaSoftwarePro.Src.Core.Contracts.CalendarEvents.CalendarEventReminderSchedule.BackgroundIntervalSeconds),
                stoppingToken);
        }
    }
}
