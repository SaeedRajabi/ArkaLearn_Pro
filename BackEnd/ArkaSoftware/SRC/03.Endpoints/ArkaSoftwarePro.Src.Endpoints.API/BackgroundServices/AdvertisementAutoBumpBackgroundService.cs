namespace ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices;

public class AdvertisementAutoBumpBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<AdvertisementAutoBumpBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var bumpService = scope.ServiceProvider
                    .GetRequiredService<ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.AdvertisementBumpService>();
                await bumpService.ProcessScheduledAutoBumpsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Advertisement auto-bump sync failed.");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
