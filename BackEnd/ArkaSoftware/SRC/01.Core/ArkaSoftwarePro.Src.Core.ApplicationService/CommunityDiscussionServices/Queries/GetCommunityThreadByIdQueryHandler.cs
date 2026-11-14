using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions.CommunityDiscussionRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.GetCommunityThreadById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CommunityDiscussionServices.Queries;

public class GetCommunityThreadByIdQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICommunityDiscussionQueriesRepository repository)
    : QueryHandler<GetCommunityThreadByIdQuery, CommunityThreadDetailQri>(outer)
{
    public override async Task<QueryResult<CommunityThreadDetailQri>> Handle(GetCommunityThreadByIdQuery query)
    {
        var item = await repository.GetByIdAsync(query);
        if (item == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(item, ApplicationServiceStatus.Ok);
    }
}
