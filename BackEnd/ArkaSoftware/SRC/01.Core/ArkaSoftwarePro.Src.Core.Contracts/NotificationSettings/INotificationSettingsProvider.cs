using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings.NotificationSettingsRepositoryContracts.Commands;
using NotificationSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.NotificationSettingsAggregate.Entities.NotificationSettings;

namespace ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;

public interface INotificationSettingsProvider
{
    Task<NotificationSettingsEntity?> GetCurrentAsync(CancellationToken cancellationToken = default);
}

public sealed class NotificationSettingsProvider(INotificationSettingsCommandRepository repository) : INotificationSettingsProvider
{
    public Task<NotificationSettingsEntity?> GetCurrentAsync(CancellationToken cancellationToken = default)
        => repository.GetCurrentAsync();
}
