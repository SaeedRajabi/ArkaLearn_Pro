using Framework.Src.Core.Contracts.Data.Commands;
using SiteAnnouncementEntity = ArkaSoftwarePro.Src.Core.Domain.SiteAnnouncementAggregate.Entities.SiteAnnouncement;

namespace ArkaSoftwarePro.Src.Core.Contracts.SiteAnnouncement.SiteAnnouncementRepositoryContracts.Commands;

public interface ISiteAnnouncementCommandRepository : ICommandRepository<SiteAnnouncementEntity, long>
{
    Task<SiteAnnouncementEntity?> GetCurrentAsync();
}
