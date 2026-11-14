using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.SearchAdminSupportTeachers;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Queries;

public class SearchAdminSupportTeachersQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatQueryRepository chatQueryRepository)
    : QueryHandler<SearchAdminSupportTeachersQuery, PagedData<AdminSupportTeacherQri>>(outer)
{
    public override async Task<QueryResult<PagedData<AdminSupportTeacherQri>>> Handle(SearchAdminSupportTeachersQuery query)
    {
        if (query.PageSize <= 0)
            query.PageSize = 7;

        var result = await chatQueryRepository.SearchTeachersForAdminAsync(query);
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
