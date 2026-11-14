using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetMySupportConversations;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Queries;

public class GetMySupportConversationsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatQueryRepository chatQueryRepository)
    : QueryHandler<GetMySupportConversationsQuery, List<SupportConversationListQri>>(outer)
{
    public override async Task<QueryResult<List<SupportConversationListQri>>> Handle(GetMySupportConversationsQuery query)
    {
        if (query.UserId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.Ok);

        var rows = await chatQueryRepository.GetConversationsForUserAsync(query.UserId, query.StudentUserId);
        return await ResultAsync(rows, ApplicationServiceStatus.Ok);
    }
}
