using ArkaSoftwarePro.Src.Core.Contracts.SiteAnnouncement.SiteAnnouncementRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.SiteAnnouncement.Queries.GetSiteAnnouncement;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class SiteAnnouncementQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), ISiteAnnouncementQueryRepository
{
    public async Task<SiteAnnouncementQri?> GetSiteAnnouncementExecuteAsync(GetSiteAnnouncementQuery query)
    {
        return await _dbContext.SiteAnnouncements
            .AsNoTracking()
            .OrderByDescending(x => x.Id)
            .Select(x => new SiteAnnouncementQri
            {
                Id = x.Id,
                IsEnabled = x.IsEnabled,
                ContentHtml = x.ContentHtml,
                TextColor = x.TextColor,
                BackgroundType = x.BackgroundType,
                BackgroundColor = x.BackgroundColor,
                GradientStartColor = x.GradientStartColor,
                GradientEndColor = x.GradientEndColor,
                GradientAngle = x.GradientAngle,
                BackgroundImageUrl = x.BackgroundImageUrl,
                LastModifiedAt = x.ModifiedDateTime ?? x.CreatedDateTime
            })
            .FirstOrDefaultAsync();
    }
}
