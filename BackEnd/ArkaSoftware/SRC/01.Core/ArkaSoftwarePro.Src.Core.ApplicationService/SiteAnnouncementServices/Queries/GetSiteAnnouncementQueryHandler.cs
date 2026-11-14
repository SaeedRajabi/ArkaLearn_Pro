using ArkaSoftwarePro.Src.Core.Contracts.SiteAnnouncement.SiteAnnouncementRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.SiteAnnouncement.Queries.GetSiteAnnouncement;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SiteAnnouncementServices.Queries;

public class GetSiteAnnouncementQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    ISiteAnnouncementQueryRepository siteAnnouncementQueryRepository)
    : QueryHandler<GetSiteAnnouncementQuery, SiteAnnouncementQri>(mafiaOuterService)
{
    public override async Task<QueryResult<SiteAnnouncementQri>> Handle(GetSiteAnnouncementQuery query)
    {
        var result = await siteAnnouncementQueryRepository.GetSiteAnnouncementExecuteAsync(query);
        if (result is null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
