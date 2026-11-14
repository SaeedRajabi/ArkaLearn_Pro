using ArkaSoftwarePro.Src.Core.Contracts.MediaUploadSettings.MediaUploadSettingsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class MediaUploadSettingsQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IMediaUploadSettingsQueryRepository
{
    public async Task<MediaUploadSettingsQri?> GetCurrentAsync(CancellationToken cancellationToken = default)
    {
        var row = await dbContext.MediaUploadSettings.AsNoTracking()
            .OrderByDescending(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (row is null) return null;

        return new MediaUploadSettingsQri
        {
            CourseIntroMaxDurationMinutes = row.CourseIntroMaxDurationMinutes,
            PromotionalVideoMaxDurationMinutes = row.PromotionalVideoMaxDurationMinutes,
        };
    }
}
