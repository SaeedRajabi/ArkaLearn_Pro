using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetAdminTeacherSupportConversations;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Queries;

public class GetAdminTeacherSupportConversationsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatQueryRepository chatQueryRepository)
    : QueryHandler<GetAdminTeacherSupportConversationsQuery, List<AdminSupportConversationListQri>>(outer)
{
    public override async Task<QueryResult<List<AdminSupportConversationListQri>>> Handle(
        GetAdminTeacherSupportConversationsQuery query)
    {
        if (query.TeacherUserId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);

        var rows = await chatQueryRepository.GetConversationsForTeacherAdminAsync(query.TeacherUserId);
        return await ResultAsync(rows, ApplicationServiceStatus.Ok);
    }
}
