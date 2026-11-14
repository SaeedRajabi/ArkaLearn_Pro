using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetSupportConversationById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Queries;

public class GetSupportConversationByIdQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatQueryRepository chatQueryRepository)
    : QueryHandler<GetSupportConversationByIdQuery, SupportConversationDetailQri>(outer)
{
    public override async Task<QueryResult<SupportConversationDetailQri>> Handle(GetSupportConversationByIdQuery query)
    {
        if (query.UserId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var detail = await chatQueryRepository.GetConversationDetailAsync(
            query.ConversationId,
            query.UserId,
            query.MessageTake,
            query.BeforeMessageId);

        if (detail == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(detail, ApplicationServiceStatus.Ok);
    }
}
