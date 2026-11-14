namespace ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices;

public class CourseLifecycleBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<CourseLifecycleBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var courseCommandRepository = scope.ServiceProvider
                    .GetRequiredService<ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands.ICourseCommandRepository>();
                await courseCommandRepository.SyncLifecycleTransitionsAsync();
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Course lifecycle sync failed.");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
