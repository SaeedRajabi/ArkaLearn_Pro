using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetAdminSupportConversationById;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetSupportConversationById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Queries;

public class GetAdminSupportConversationByIdQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatQueryRepository chatQueryRepository)
    : QueryHandler<GetAdminSupportConversationByIdQuery, SupportConversationDetailQri>(outer)
{
    public override async Task<QueryResult<SupportConversationDetailQri>> Handle(
        GetAdminSupportConversationByIdQuery query)
    {
        if (query.TeacherUserId <= 0 || query.ConversationId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var detail = await chatQueryRepository.GetConversationDetailForAdminAsync(
            query.ConversationId,
            query.TeacherUserId,
            query.StaffUserId,
            query.MessageTake,
            query.BeforeMessageId);

        if (detail == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(detail, ApplicationServiceStatus.Ok);
    }
}
