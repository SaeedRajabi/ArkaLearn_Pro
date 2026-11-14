using Framework.Src.Core.Contracts.Data.Commands;
using MediaUploadSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.MediaUploadSettingsAggregate.Entities.MediaUploadSettings;

namespace ArkaSoftwarePro.Src.Core.Contracts.MediaUploadSettings.MediaUploadSettingsRepositoryContracts.Commands;

public interface IMediaUploadSettingsCommandRepository : ICommandRepository<MediaUploadSettingsEntity, long>
{
    Task<MediaUploadSettingsEntity?> GetCurrentAsync(CancellationToken cancellationToken = default);
}
