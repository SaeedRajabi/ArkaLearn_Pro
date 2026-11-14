namespace ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.SupportChat;

public class SupportChatSmsBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<SupportChatSmsBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var scheduler = scope.ServiceProvider.GetRequiredService<ArkaSoftwarePro.Src.Core.Contracts.SupportChat.ISupportChatSmsScheduler>();
                await scheduler.ProcessDueRemindersAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Support chat SMS reminder processing failed.");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
