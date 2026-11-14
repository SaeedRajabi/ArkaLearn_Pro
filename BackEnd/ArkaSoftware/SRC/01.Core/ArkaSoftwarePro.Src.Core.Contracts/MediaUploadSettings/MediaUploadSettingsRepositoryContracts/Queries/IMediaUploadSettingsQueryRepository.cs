using Framework.Src.Core.Contracts.Data.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.MediaUploadSettings.MediaUploadSettingsRepositoryContracts.Queries;

public sealed class MediaUploadSettingsQri
{
    public int CourseIntroMaxDurationMinutes { get; set; } = 5;
    public int PromotionalVideoMaxDurationMinutes { get; set; } = 5;
}

public interface IMediaUploadSettingsQueryRepository : IQueryRepository
{
    Task<MediaUploadSettingsQri?> GetCurrentAsync(CancellationToken cancellationToken = default);
}
