using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetActiveTeacherStories;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Queries;

public class GetActiveTeacherStoriesQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatQueryRepository chatQueryRepository)
    : QueryHandler<GetActiveTeacherStoriesQuery, List<TeacherStoryQri>>(outer)
{
    public override async Task<QueryResult<List<TeacherStoryQri>>> Handle(GetActiveTeacherStoriesQuery query)
    {
        if (query.UserId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.Ok);

        var rows = await chatQueryRepository.GetActiveTeacherStoriesAsync(query.UserId, query.IsAdmin);
        return await ResultAsync(rows, ApplicationServiceStatus.Ok);
    }
}
