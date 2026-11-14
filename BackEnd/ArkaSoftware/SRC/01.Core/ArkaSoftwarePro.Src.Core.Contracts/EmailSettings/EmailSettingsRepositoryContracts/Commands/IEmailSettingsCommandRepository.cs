using Framework.Src.Core.Contracts.Data.Commands;
using EmailSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.EmailSettingsAggregate.Entities.EmailSettings;

namespace ArkaSoftwarePro.Src.Core.Contracts.EmailSettings.EmailSettingsRepositoryContracts.Commands;

public interface IEmailSettingsCommandRepository : ICommandRepository<EmailSettingsEntity, long>
{
    Task<EmailSettingsEntity?> GetCurrentAsync();
}
