using Framework.Src.Core.Contracts.Data.Commands;
using NotificationSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.NotificationSettingsAggregate.Entities.NotificationSettings;

namespace ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings.NotificationSettingsRepositoryContracts.Commands;

public interface INotificationSettingsCommandRepository : ICommandRepository<NotificationSettingsEntity, long>
{
    Task<NotificationSettingsEntity?> GetCurrentAsync();
}
