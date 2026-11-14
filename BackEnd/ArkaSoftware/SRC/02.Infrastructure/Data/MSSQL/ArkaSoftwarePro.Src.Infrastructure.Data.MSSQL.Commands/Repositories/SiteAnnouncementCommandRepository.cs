using ArkaSoftwarePro.Src.Core.Contracts.SiteAnnouncement.SiteAnnouncementRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SiteAnnouncementAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class SiteAnnouncementCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<SiteAnnouncement, ArkaSoftwareCommandDbContext>(dbContext), ISiteAnnouncementCommandRepository
{
    public async Task<SiteAnnouncement?> GetCurrentAsync()
    {
        return await _dbContext.SiteAnnouncements
            .OrderByDescending(x => x.Id)
            .FirstOrDefaultAsync();
    }
}
