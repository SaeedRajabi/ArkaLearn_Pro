using ArkaSoftwarePro.Src.Core.Contracts.MediaUploadSettings.MediaUploadSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;
using MediaUploadSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.MediaUploadSettingsAggregate.Entities.MediaUploadSettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class MediaUploadSettingsCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<MediaUploadSettingsEntity, ArkaSoftwareCommandDbContext>(dbContext), IMediaUploadSettingsCommandRepository
{
    public async Task<MediaUploadSettingsEntity?> GetCurrentAsync(CancellationToken cancellationToken = default)
        => await _dbContext.MediaUploadSettings.OrderByDescending(x => x.Id).FirstOrDefaultAsync(cancellationToken);
}
