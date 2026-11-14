using ArkaSoftwarePro.Src.Core.RequestResponse.SiteAnnouncement.Queries.GetSiteAnnouncement;
using Framework.Src.Core.Contracts.Data.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.SiteAnnouncement.SiteAnnouncementRepositoryContracts.Queries;

public interface ISiteAnnouncementQueryRepository : IQueryRepository
{
    Task<SiteAnnouncementQri?> GetSiteAnnouncementExecuteAsync(GetSiteAnnouncementQuery query);
}
