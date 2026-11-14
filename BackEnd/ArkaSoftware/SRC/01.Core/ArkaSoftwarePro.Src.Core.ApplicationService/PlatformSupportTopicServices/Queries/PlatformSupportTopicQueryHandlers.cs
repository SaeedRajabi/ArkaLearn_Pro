using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.PlatformSupportTopics.PlatformSupportTopicRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Queries.GetPlatformSupportTopicById;
using ArkaSoftwarePro.Src.Core.RequestResponse.PlatformSupportTopics.Queries.ListPlatformSupportTopics;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.PlatformSupportTopicServices.Queries;

public class ListPlatformSupportTopicsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IPlatformSupportTopicQueryRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<ListPlatformSupportTopicsQuery, List<PlatformSupportTopicListItemQri>>(outer)
{
    public override async Task<QueryResult<List<PlatformSupportTopicListItemQri>>> Handle(ListPlatformSupportTopicsQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);

        var items = await repository.ListAllAsync();
        return await ResultAsync(items.ToList(), ApplicationServiceStatus.Ok);
    }
}

public class ListPublishedPlatformSupportTopicsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IPlatformSupportTopicQueryRepository repository)
    : QueryHandler<ListPublishedPlatformSupportTopicsQuery, List<PlatformSupportTopicListItemQri>>(outer)
{
    public override async Task<QueryResult<List<PlatformSupportTopicListItemQri>>> Handle(ListPublishedPlatformSupportTopicsQuery query)
    {
        var items = await repository.ListPublishedAsync();
        return await ResultAsync(items.ToList(), ApplicationServiceStatus.Ok);
    }
}

public class GetPlatformSupportTopicByIdQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IPlatformSupportTopicQueryRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetPlatformSupportTopicByIdQuery, PlatformSupportTopicDetailQri>(outer)
{
    public override async Task<QueryResult<PlatformSupportTopicDetailQri>> Handle(GetPlatformSupportTopicByIdQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        if (query.Id <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var detail = await repository.GetByIdAsync(query.Id, publishedOnly: false);
        if (detail == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(detail, ApplicationServiceStatus.Ok);
    }
}

public class GetPublishedPlatformSupportTopicByIdQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IPlatformSupportTopicQueryRepository repository)
    : QueryHandler<GetPublishedPlatformSupportTopicByIdQuery, PlatformSupportTopicDetailQri>(outer)
{
    public override async Task<QueryResult<PlatformSupportTopicDetailQri>> Handle(GetPublishedPlatformSupportTopicByIdQuery query)
    {
        if (query.Id <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var detail = await repository.GetByIdAsync(query.Id, publishedOnly: true);
        if (detail == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(detail, ApplicationServiceStatus.Ok);
    }
}
